<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class RegisterEventRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'registration_path' => 'required|in:NIAM,UMUM',
            'niam' => 'required_if:registration_path,NIAM|string|max:50',
            'full_name' => 'required_if:registration_path,UMUM|string|max:255',
            'whatsapp' => 'required_if:registration_path,UMUM|string|max:20',
            'institution_name' => 'nullable|string|max:255',
            'id_card' => 'nullable|image|max:4096',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $validator->errors()->first() ?: 'Validasi gagal.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
