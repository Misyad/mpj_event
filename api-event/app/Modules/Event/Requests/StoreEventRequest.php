<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:500',
            'category' => 'required|in:Pelatihan,Seremonial,Rapat',
            'event_type' => 'nullable|in:Sistem Kelas,Non-Kelas',
            'description' => 'nullable|string',
            'location_name' => 'nullable|string|max:500',
            'location_gmaps' => 'nullable|string|max:500',
            'start_date' => 'required|date',
            'registration_deadline' => 'nullable|date',
            'is_open_for_public' => 'boolean',
            'is_paid' => 'boolean',
            'price_niam' => 'nullable|integer|min:0',
            'price_public' => 'nullable|integer|min:0',
            'max_participants' => 'nullable|integer|min:1',
            'status' => 'nullable|in:DRAFT,PENDING,APPROVED,LIVE,FINISHED,COMPLETED',
            'payment_method' => 'nullable|in:manual,gateway',
            'bank_account_id' => 'nullable|string|max:36',
            'speaker_id' => 'nullable|string|max:36',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.label' => 'required_with:custom_fields|string|max:255',
            'custom_fields.*.type' => 'required_with:custom_fields|in:short_text,long_text,radio,dropdown,checkbox',
            'custom_fields.*.options' => 'nullable|array',
            'custom_fields.*.is_required' => 'boolean',
        ];
    }
}
