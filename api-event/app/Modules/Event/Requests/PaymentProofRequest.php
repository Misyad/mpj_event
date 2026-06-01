<?php

namespace App\Modules\Event\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class PaymentProofRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'qr_token' => 'required|string|max:100',
            'payment_proof' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
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
