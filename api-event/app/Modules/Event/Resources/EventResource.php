<?php

namespace App\Modules\Event\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'event_type' => $this->event_type,
            'poster_path' => $this->poster_path,
            'description' => $this->description,
            'location_name' => $this->location_name,
            'location_gmaps' => $this->location_gmaps,
            'start_date' => optional($this->start_date)->toISOString(),
            'registration_deadline' => optional($this->registration_deadline)->toISOString(),
            'is_open_for_public' => (bool) $this->is_open_for_public,
            'is_paid' => (bool) $this->is_paid,
            'price_niam' => (int) $this->price_niam,
            'price_public' => (int) $this->price_public,
            'max_participants' => $this->max_participants,
            'current_participants' => (int) $this->current_participants,
            'status_pendaftaran' => $this->status_pendaftaran,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'gateway_provider' => $this->gateway_provider,
            'gateway_config' => $this->gateway_config,
            'bank_account_id' => $this->bank_account_id,
            'speaker' => new SpeakerResource($this->whenLoaded('speaker')),
            'custom_fields' => CustomFieldResource::collection($this->whenLoaded('customFields')),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
