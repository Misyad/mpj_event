<?php

namespace App\Modules\Event\Services;

use App\Modules\Event\Models\AttendanceLog;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\EventParticipant;

class AttendanceService
{
    public function checkIn(array $data): array
    {
        $participant = EventParticipant::where('qr_token', $data['qr_token'])->with(['event', 'crew', 'guest', 'payment'])->first();
        if (!$participant) return ['status' => 404, 'success' => false, 'message' => 'QR tidak dikenali atau tidak valid.'];
        if (!in_array($participant->payment_status, ['Paid', 'Free'], true)) {
            $this->log($participant, $data, false, 'Pembayaran belum dikonfirmasi.');
            return ['status' => 422, 'success' => false, 'message' => 'Pembayaran peserta belum dikonfirmasi.'];
        }
        if ($participant->attendance_status === 'Attended') {
            $this->log($participant, $data, false, 'Tiket sudah digunakan.');
            return ['status' => 409, 'success' => false, 'message' => 'QR Code ini sudah digunakan sebelumnya.', 'participant' => $participant];
        }
        if ($participant->attendance_status === 'Cancelled') {
            $this->log($participant, $data, false, 'Tiket dibatalkan.');
            return ['status' => 422, 'success' => false, 'message' => 'Tiket ini telah dibatalkan.'];
        }

        $participant->update(['attendance_status' => 'Attended', 'attended_at' => now()]);
        $this->log($participant, $data, true, null);
        return ['status' => 200, 'success' => true, 'message' => 'Check-in berhasil!', 'participant' => $participant->fresh(['event', 'crew', 'guest', 'payment'])];
    }

    public function verify(string $token): EventParticipant
    {
        $participant = EventParticipant::where('qr_token', $token)->with(['event', 'crew', 'guest', 'payment'])->first();
        if (!$participant) abort(response()->json(['valid' => false, 'message' => 'Token tidak dikenali.'], 404));
        return $participant;
    }

    public function logByEvent(string $eventId): array
    {
        $event = Event::findOrFail($eventId);
        $attended = $event->participants()->with(['crew', 'guest'])->where('attendance_status', 'Attended')->latest('attended_at')->get();
        return ['event_title' => $event->title, 'total_registered' => $event->participants()->count(), 'total_attended' => $attended->count(), 'participants' => $attended];
    }

    public function cancel(string $participantId): EventParticipant
    {
        $participant = EventParticipant::findOrFail($participantId);
        $participant->update(['attendance_status' => 'Cancelled']);
        return $participant->fresh(['event', 'crew', 'guest', 'payment']);
    }

    private function log(EventParticipant $participant, array $data, bool $success, ?string $reason): void
    {
        AttendanceLog::create([
            'event_id' => $participant->event_id,
            'participant_id' => $participant->id,
            'qr_token' => $participant->qr_token,
            'scanned_by_name' => $data['scanner_name'] ?? null,
            'scanner_device' => $data['scanner_device'] ?? null,
            'scanned_at' => now(),
            'success' => $success,
            'failure_reason' => $reason,
        ]);
    }
}
