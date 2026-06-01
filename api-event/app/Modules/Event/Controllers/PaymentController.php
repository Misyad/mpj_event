<?php

namespace App\Modules\Event\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Event\Helpers\EventApiResponse;
use App\Modules\Event\Requests\PaymentDecisionRequest;
use App\Modules\Event\Requests\PaymentProofRequest;
use App\Modules\Event\Resources\ParticipantResource;
use App\Modules\Event\Services\PaymentService;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function uploadProof(PaymentProofRequest $request) { return EventApiResponse::success(new ParticipantResource($this->payments->uploadProof($request->validated('qr_token'), $request->file('payment_proof'))), 'Bukti transfer dikirim.'); }
    public function proofPreview(string $participantId)
    {
        $proof = $this->payments->proofPreview($participantId);

        return response()->file($proof['path'], [
            'Content-Type' => $proof['mime'],
            'Content-Disposition' => 'inline; filename="'.$proof['name'].'"',
        ]);
    }

    public function approve(string $participantId) { return EventApiResponse::success(new ParticipantResource($this->payments->approve($participantId)), 'Pembayaran diverifikasi.'); }
    public function reject(PaymentDecisionRequest $request, string $participantId) { return EventApiResponse::success(new ParticipantResource($this->payments->reject($participantId, $request->validated('reason'))), 'Bukti pembayaran ditolak.'); }
    public function approvePayment(string $paymentId) { return EventApiResponse::success(new ParticipantResource($this->payments->approvePayment($paymentId)), 'Pembayaran diverifikasi.'); }
    public function rejectPayment(PaymentDecisionRequest $request, string $paymentId) { return EventApiResponse::success(new ParticipantResource($this->payments->rejectPayment($paymentId, $request->validated('reason'))), 'Bukti pembayaran ditolak.'); }
}
