<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'qr_token' => 'required|string|max:100',
            'scanner_name' => 'nullable|string|max:100',
            'scanner_device' => 'nullable|string|max:100',
        ];
    }
}
