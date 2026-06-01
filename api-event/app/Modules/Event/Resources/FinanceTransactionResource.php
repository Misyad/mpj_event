<?php

namespace App\Modules\Event\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FinanceTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'type' => $this->type,
            'source' => $this->source,
            'title' => $this->title,
            'description' => $this->description,
            'amount' => (int) $this->amount,
            'status' => $this->status,
            'transaction_date' => optional($this->transaction_date)->toISOString(),
            'participant_id' => $this->participant_id,
            'payment_id' => $this->payment_id,
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
