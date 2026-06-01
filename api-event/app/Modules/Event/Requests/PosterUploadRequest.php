<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PosterUploadRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['poster' => 'required|image|max:4096']; }
}
