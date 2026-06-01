<?php

namespace App\Modules\Event\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Event\Helpers\EventApiResponse;
use App\Modules\Event\Requests\RegisterEventRequest;
use App\Modules\Event\Resources\ParticipantResource;
use App\Modules\Event\Services\RegistrationService;

class RegistrationController extends Controller
{
    public function __construct(private readonly RegistrationService $registration) {}

    public function validateNiam(string $niam) { return response()->json($this->registration->validateNiam($niam)); }
    public function register(RegisterEventRequest $request, string $id) { return EventApiResponse::success(new ParticipantResource($this->registration->register($id, $request->validated(), $request->file('id_card'))), 'Pendaftaran berhasil.', 201); }
    public function ticket(string $token) { return EventApiResponse::success(new ParticipantResource($this->registration->ticket($token))); }
}
