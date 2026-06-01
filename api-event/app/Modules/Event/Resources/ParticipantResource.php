<?php

namespace App\Modules\Event\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'registration_path' => $this->registration_path,
            'display_name' => $this->display_name,
            'crew' => $this->whenLoaded('crew'),
            'guest' => $this->whenLoaded('guest'),
            'payment_status' => $this->payment_status,
            'unique_amount' => (int) $this->unique_amount,
            'payment_proof_path' => $this->payment_proof_path,
            'payment_proof_preview_url' => $this->payment_proof_path ? url('/api-event/v1/event/admin/payments/'.$this->id.'/proof') : null,
            'attendance_status' => $this->attendance_status,
            'qr_token' => $this->qr_token,
            'attended_at' => optional($this->attended_at)->toISOString(),
            'event' => new EventResource($this->whenLoaded('event')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
