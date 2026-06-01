<?php

namespace App\Modules\Event\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Event\Collections\EventCollection;
use App\Modules\Event\Collections\ParticipantCollection;
use App\Modules\Event\Helpers\EventApiResponse;
use App\Modules\Event\Requests\CustomFieldsRequest;
use App\Modules\Event\Requests\EventStatusRequest;
use App\Modules\Event\Requests\PosterUploadRequest;
use App\Modules\Event\Requests\StoreEventRequest;
use App\Modules\Event\Requests\UpdateEventRequest;
use App\Modules\Event\Resources\CustomFieldResource;
use App\Modules\Event\Resources\EventResource;
use App\Modules\Event\Services\EventService;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function __construct(private readonly EventService $events) {}

    public function index() { return EventApiResponse::success(new EventCollection($this->events->publicIndex())); }
    public function show(string $id) { return EventApiResponse::success(new EventResource($this->events->publicShow($id))); }
    public function adminIndex(Request $request) { return new EventCollection($this->events->adminIndex($request->all())); }
    public function store(StoreEventRequest $request) { return EventApiResponse::success(new EventResource($this->events->create($request->validated())), 'Event dibuat.', 201); }
    public function adminShow(string $id) { return EventApiResponse::success(new EventResource($this->events->show($id))); }
    public function update(UpdateEventRequest $request, string $id) { return EventApiResponse::success(new EventResource($this->events->update($id, $request->validated())), 'Event diperbarui.'); }
    public function destroy(string $id) { $this->events->delete($id); return EventApiResponse::message('Event dihapus.'); }
    public function changeStatus(EventStatusRequest $request, string $id) { return EventApiResponse::success(new EventResource($this->events->changeStatus($id, $request->validated('status'))), 'Status event diperbarui.'); }
    public function syncCustomFields(CustomFieldsRequest $request, string $id) { return EventApiResponse::success(CustomFieldResource::collection($this->events->syncCustomFields($id, $request->validated('fields'))), 'Custom fields disimpan.'); }
    public function uploadPoster(PosterUploadRequest $request, string $id) { return EventApiResponse::message('Poster diunggah.', 200, ['url' => $this->events->uploadPoster($id, $request->file('poster'))]); }
    public function participants(Request $request, string $id) { return new ParticipantCollection($this->events->participants($id, $request->all())); }
    public function stats(string $id) { return EventApiResponse::success($this->events->stats($id)); }
    public function exportCsv(string $id) { return $this->events->exportCsv($id); }
}
