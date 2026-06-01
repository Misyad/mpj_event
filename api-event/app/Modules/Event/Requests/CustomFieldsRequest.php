<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomFieldsRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'fields' => 'required|array',
            'fields.*.label' => 'required|string|max:255',
            'fields.*.type' => 'required|in:short_text,long_text,radio,dropdown,checkbox',
            'fields.*.options' => 'nullable|array',
            'fields.*.is_required' => 'boolean',
        ];
    }
}
