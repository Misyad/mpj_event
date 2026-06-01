<?php

namespace App\Modules\Event\Services;

use App\Modules\Event\Helpers\EventUploadHelper;
use App\Modules\Event\Models\CrewMember;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\EventGuest;
use App\Modules\Event\Models\EventParticipant;
use App\Modules\Event\Models\Payment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RegistrationService
{
    public function validateNiam(string $niam): array
    {
        $crew = CrewMember::where('niam', $niam)->first();
        if (!$crew) abort(response()->json(['success' => false, 'message' => 'NIAM tidak ditemukan.', 'valid' => false], 404));
        return ['valid' => true, 'crew' => $crew];
    }

    public function register(string $eventId, array $data, ?UploadedFile $idCard = null): EventParticipant
    {
        return DB::transaction(function () use ($eventId, $data, $idCard) {
            $event = Event::whereKey($eventId)->lockForUpdate()->firstOrFail();

            if (in_array($event->status, ['FINISHED', 'COMPLETED'], true)) {
                $this->reject('Event sudah selesai.', 422, ['event_id' => $event->id, 'status' => $event->status]);
            }

            if (!in_array($event->status, ['APPROVED', 'LIVE'], true)) {
                $this->reject('Event tidak menerima pendaftaran saat ini.', 422, ['event_id' => $event->id, 'status' => $event->status]);
            }

            if ($event->status_pendaftaran === 'full') {
                $this->reject('Kuota event sudah penuh.', 422, ['event_id' => $event->id, 'status_pendaftaran' => $event->status_pendaftaran]);
            }

            if ($event->status_pendaftaran !== 'open') {
                $this->reject('Pendaftaran event sedang ditutup.', 422, ['event_id' => $event->id, 'status_pendaftaran' => $event->status_pendaftaran]);
            }

            if ($event->registration_deadline && now()->isAfter($event->registration_deadline)) {
                $this->reject('Masa pendaftaran telah berakhir.', 422, ['event_id' => $event->id, 'deadline' => (string) $event->registration_deadline]);
            }

            $activeParticipantCount = EventParticipant::where('event_id', $event->id)
                ->where('attendance_status', '!=', 'Cancelled')
                ->lockForUpdate()
                ->count();

            if ($event->max_participants !== null && $activeParticipantCount >= $event->max_participants) {
                $event->update(['status_pendaftaran' => 'full', 'current_participants' => $activeParticipantCount]);
                $this->reject('Kuota event sudah penuh.', 422, ['event_id' => $event->id, 'max_participants' => $event->max_participants]);
            }

            $path = $data['registration_path'];
            $basePrice = $path === 'NIAM' ? $event->price_niam : $event->price_public;
            $uniqueAmount = $event->is_paid ? $basePrice + random_int(1, 999) : 0;

            if ($path === 'NIAM') {
                $crew = CrewMember::where('niam', $data['niam'])->first();
                if (!$crew) {
                    $this->reject('NIAM tidak ditemukan.', 404, ['event_id' => $event->id, 'niam' => $data['niam']]);
                }
                if (EventParticipant::where('event_id', $event->id)->where('crew_id', $crew->id)->exists()) {
                    $this->reject('NIAM ini sudah terdaftar di event ini.', 409, ['event_id' => $event->id, 'crew_id' => $crew->id]);
                }
                $guestId = null;
                $crewId = $crew->id;
            } else {
                if (!$event->is_open_for_public) {
                    $this->reject('Event ini tidak terbuka untuk umum.', 422, ['event_id' => $event->id]);
                }

                $guest = EventGuest::firstOrNew(['whatsapp' => $data['whatsapp']]);
                if (!$guest->exists || $guest->full_name !== $data['full_name']) {
                    $guest->full_name = $data['full_name'];
                }
                $guest->institution_name = $data['institution_name'] ?? $guest->institution_name;
                if ($idCard) {
                    $guest->id_card_path = EventUploadHelper::storeIdentityPhoto($event->id, $idCard);
                }
                $guest->save();

                if (EventParticipant::where('event_id', $event->id)->where('guest_id', $guest->id)->exists()) {
                    $this->reject('Nomor WhatsApp ini sudah terdaftar.', 409, ['event_id' => $event->id, 'guest_id' => $guest->id]);
                }
                $guestId = $guest->id;
                $crewId = null;
            }

            $participant = EventParticipant::create([
                'event_id' => $event->id,
                'crew_id' => $crewId,
                'guest_id' => $guestId,
                'registration_path' => $path,
                'payment_status' => $event->is_paid ? 'Unpaid' : 'Free',
                'unique_amount' => $uniqueAmount,
                'attendance_status' => 'Registered',
                'qr_token' => $this->generateTicketToken(),
            ]);

            Payment::create([
                'participant_id' => $participant->id,
                'amount' => $uniqueAmount,
                'status' => $event->is_paid ? 'Unpaid' : 'Paid',
                'verified_at' => $event->is_paid ? null : now(),
            ]);

            $newParticipantCount = EventParticipant::where('event_id', $event->id)
                ->where('attendance_status', '!=', 'Cancelled')
                ->count();
            $event->update([
                'current_participants' => $newParticipantCount,
                'status_pendaftaran' => $event->max_participants !== null && $newParticipantCount >= $event->max_participants ? 'full' : $event->status_pendaftaran,
            ]);

            Log::info('event.registration.created', [
                'event_id' => $event->id,
                'participant_id' => $participant->id,
                'registration_path' => $participant->registration_path,
                'payment_status' => $participant->payment_status,
            ]);

            return $participant->fresh(['event', 'crew', 'guest', 'payment']);
        });
    }

    public function ticket(string $token): EventParticipant
    {
        $participant = EventParticipant::where('qr_token', $token)->with(['event', 'crew', 'guest', 'payment'])->first();
        if (!$participant) abort(response()->json(['success' => false, 'message' => 'Tiket tidak ditemukan.'], 404));
        if (!in_array($participant->payment_status, ['Paid', 'Free'], true)) abort(response()->json(['success' => false, 'message' => 'Pembayaran belum dikonfirmasi.', 'status' => $participant->payment_status], 403));
        if ($participant->payment_status === 'Paid' && $participant->payment?->status !== 'Paid') {
            abort(response()->json(['success' => false, 'message' => 'Status pembayaran tidak sinkron.', 'status' => $participant->payment_status], 403));
        }

        return $participant;
    }

    private function generateTicketToken(): string
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $token = 'EVT-'.strtoupper(Str::random(24));
            if (!EventParticipant::where('qr_token', $token)->exists()) return $token;
        }

        return 'EVT-'.strtoupper((string) Str::uuid());
    }

    private function reject(string $message, int $status, array $context = []): never
    {
        Log::warning('event.registration.rejected', $context + ['message' => $message, 'status' => $status]);
        abort(response()->json([
            'success' => false,
            'message' => $message,
        ], $status));
    }
}
