<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EventStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['status' => 'required|in:DRAFT,PENDING,APPROVED,LIVE,FINISHED,COMPLETED']; }
}
