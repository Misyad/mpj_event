<?php

namespace App\Modules\Event\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'participant_id' => $this->participant_id,
            'amount' => (int) $this->amount,
            'status' => $this->status,
            'proof_path' => $this->proof_path,
            'proof_url' => $this->proof_path ? url('/api-event/v1/event/admin/payments/'.$this->participant_id.'/proof') : null,
            'preview_url' => $this->proof_path ? url('/api-event/v1/event/admin/payments/'.$this->participant_id.'/proof') : null,
            'submitted_at' => optional($this->submitted_at)->toISOString(),
            'verified_by' => $this->verified_by,
            'verified_at' => optional($this->verified_at)->toISOString(),
            'rejection_reason' => $this->rejection_reason,
        ];
    }
}
