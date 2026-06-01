<?php

namespace App\Modules\Event\Services;

use App\Modules\Event\Helpers\EventUploadHelper;
use App\Modules\Event\Models\EventParticipant;
use App\Modules\Event\Models\Payment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class PaymentService
{
    public function uploadProof(string $qrToken, UploadedFile $file): EventParticipant
    {
        $newPath = null;
        $oldPaths = [];

        try {
            $participant = DB::transaction(function () use ($qrToken, $file, &$newPath, &$oldPaths) {
                $participant = EventParticipant::where('qr_token', $qrToken)->lockForUpdate()->first();

                if (!$participant) {
                    $this->rejectResponse('Tiket tidak ditemukan.', 404);
                }

                $participant->load('payment');

                if ($participant->payment_status === 'Paid') {
                    $this->rejectResponse('Pembayaran sudah diverifikasi.', 409);
                }

                if ($participant->payment_status === 'Free') {
                    $this->rejectResponse('Event ini gratis, tidak perlu bukti bayar.', 422);
                }

                if (!in_array($participant->payment_status, ['Unpaid', 'Pending_Approval'], true)) {
                    $this->rejectResponse('Status pembayaran tidak valid untuk upload bukti transfer.', 422);
                }

                $oldPaths = array_filter([
                    $participant->payment_proof_path,
                    $participant->payment?->proof_path,
                ]);

                $newPath = EventUploadHelper::storePaymentProof($participant->event_id, $participant->id, $file);

                $participant->update([
                    'payment_status' => 'Pending_Approval',
                    'payment_proof_path' => $newPath,
                ]);

                Payment::updateOrCreate(
                    ['participant_id' => $participant->id],
                    [
                        'amount' => $participant->unique_amount,
                        'status' => 'Pending_Approval',
                        'proof_path' => $newPath,
                        'submitted_at' => now(),
                        'verified_at' => null,
                        'rejection_reason' => null,
                    ]
                );

                return $participant->fresh(['event', 'crew', 'guest', 'payment']);
            });
        } catch (Throwable $exception) {
            EventUploadHelper::deleteStoredFile($newPath);
            throw $exception;
        }

        foreach (array_unique($oldPaths) as $oldPath) {
            if ($oldPath !== $newPath) {
                EventUploadHelper::deleteStoredFile($oldPath);
            }
        }

        return $participant;
    }

    public function proofPreview(string $participantId): array
    {
        $participant = EventParticipant::with('payment')->find($participantId);

        if (!$participant) {
            $this->rejectResponse('Peserta tidak ditemukan.', 404);
        }

        $proofPath = $participant->payment_proof_path ?: $participant->payment?->proof_path;

        if (!$proofPath) {
            $this->rejectResponse('Bukti transfer belum diupload.', 422);
        }

        $storedFile = EventUploadHelper::storedFile($proofPath);

        if (!$storedFile || !Storage::disk($storedFile['disk'])->exists($storedFile['path'])) {
            $this->rejectResponse('File bukti transfer tidak ditemukan.', 404);
        }

        return [
            'path' => Storage::disk($storedFile['disk'])->path($storedFile['path']),
            'mime' => Storage::disk($storedFile['disk'])->mimeType($storedFile['path']) ?: 'application/octet-stream',
            'name' => basename($storedFile['path']),
        ];
    }

    public function approve(string $participantId): EventParticipant
    {
        $payment = Payment::where('participant_id', $participantId)->first();

        if (!$payment) {
            $this->rejectResponse('Payment tidak ditemukan.', 404);
        }

        return $this->approvePayment($payment->id);
    }

    public function reject(string $participantId, ?string $reason = null): EventParticipant
    {
        $payment = Payment::where('participant_id', $participantId)->first();

        if (!$payment) {
            $this->rejectResponse('Payment tidak ditemukan.', 404);
        }

        return $this->rejectPayment($payment->id, $reason);
    }

    public function approvePayment(string $paymentId): EventParticipant
    {
        return DB::transaction(function () use ($paymentId) {
            [$payment, $participant] = $this->lockedPaymentParticipant($paymentId);

            if ($payment->status === 'Paid' || $participant->payment_status === 'Paid') {
                $this->rejectResponse('Pembayaran sudah diverifikasi.', 409);
            }

            if ($payment->status !== 'Pending_Approval' || $participant->payment_status !== 'Pending_Approval') {
                $this->rejectResponse('Status pembayaran tidak valid untuk disetujui.', 422);
            }

            if (!$payment->proof_path && !$participant->payment_proof_path) {
                $this->rejectResponse('Bukti transfer belum diupload.', 422);
            }

            $payment->update([
                'amount' => $participant->unique_amount,
                'status' => 'Paid',
                'verified_at' => now(),
                'rejection_reason' => null,
            ]);

            $participant->update(['payment_status' => 'Paid']);

            return $participant->fresh(['event', 'crew', 'guest', 'payment']);
        });
    }

    public function rejectPayment(string $paymentId, ?string $reason = null): EventParticipant
    {
        return DB::transaction(function () use ($paymentId, $reason) {
            [$payment, $participant] = $this->lockedPaymentParticipant($paymentId);

            if ($payment->status === 'Paid' || $participant->payment_status === 'Paid') {
                $this->rejectResponse('Pembayaran yang sudah diverifikasi tidak bisa ditolak.', 409);
            }

            if ($payment->status !== 'Pending_Approval' || $participant->payment_status !== 'Pending_Approval') {
                $this->rejectResponse('Status pembayaran tidak valid untuk ditolak.', 422);
            }

            $payment->update([
                'amount' => $participant->unique_amount,
                'status' => 'Rejected',
                'verified_at' => null,
                'rejection_reason' => $reason,
            ]);

            $participant->update(['payment_status' => 'Unpaid']);

            return $participant->fresh(['event', 'crew', 'guest', 'payment']);
        });
    }

    private function lockedPaymentParticipant(string $paymentId): array
    {
        $payment = Payment::whereKey($paymentId)->lockForUpdate()->first();

        if (!$payment) {
            $this->rejectResponse('Payment tidak ditemukan.', 404);
        }

        $participant = EventParticipant::whereKey($payment->participant_id)->lockForUpdate()->first();

        if (!$participant) {
            $this->rejectResponse('Peserta tidak ditemukan.', 404);
        }

        return [$payment, $participant];
    }

    private function rejectResponse(string $message, int $status): never
    {
        abort(response()->json([
            'success' => false,
            'message' => $message,
        ], $status));
    }
}
