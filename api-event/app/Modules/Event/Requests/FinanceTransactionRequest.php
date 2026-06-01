<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinanceTransactionRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'type' => 'required|in:income,expense',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|integer|min:0',
            'transaction_date' => 'nullable|date',
        ];
    }
}
