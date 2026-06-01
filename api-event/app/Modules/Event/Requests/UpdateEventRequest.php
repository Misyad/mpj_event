<?php

namespace App\Modules\Event\Requests;

class UpdateEventRequest extends StoreEventRequest
{
    public function rules(): array
    {
        return collect(parent::rules())
            ->map(fn ($rule) => is_string($rule) ? 'sometimes|'.$rule : $rule)
            ->all();
    }
}
