<?php

namespace App\Modules\Event\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Event\Helpers\EventApiResponse;
use App\Modules\Event\Requests\CheckInRequest;
use App\Modules\Event\Resources\ParticipantResource;
use App\Modules\Event\Services\AttendanceService;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance) {}

    public function checkIn(CheckInRequest $request)
    {
        $result = $this->attendance->checkIn($request->validated());
        if (!empty($result['participant'])) $result['participant'] = new ParticipantResource($result['participant']);
        return response()->json($result, $result['status']);
    }

    public function verify(string $token) { return response()->json(['valid' => true, 'participant' => new ParticipantResource($this->attendance->verify($token))]); }
    public function log(string $eventId) { return EventApiResponse::success($this->attendance->logByEvent($eventId)); }
    public function cancel(string $participantId) { return EventApiResponse::success(new ParticipantResource($this->attendance->cancel($participantId)), 'Tiket peserta dibatalkan.'); }
}
