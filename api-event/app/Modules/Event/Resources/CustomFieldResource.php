<?php

namespace App\Modules\Event\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'label' => $this->label,
            'type' => $this->type,
            'options' => $this->options ?? [],
            'is_required' => (bool) $this->is_required,
            'order' => (int) $this->order_num,
        ];
    }
}
