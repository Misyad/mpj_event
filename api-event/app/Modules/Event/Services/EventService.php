<?php

namespace App\Modules\Event\Services;

use App\Modules\Event\Helpers\EventUploadHelper;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\EventCustomField;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EventService
{
    public function publicIndex()
    {
        return Event::publicListing()->with(['speaker', 'customFields'])->orderBy('start_date')->get();
    }

    public function publicShow(string $id): Event
    {
        return Event::publicListing()->with(['speaker', 'customFields'])->findOrFail($id);
    }

    public function adminIndex(array $filters): LengthAwarePaginator
    {
        $query = Event::with(['speaker', 'customFields'])->latest('created_at');
        if (!empty($filters['status'])) $query->where('status', $filters['status']);
        if (!empty($filters['q'])) $query->where('title', 'like', '%'.$filters['q'].'%');
        return $query->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function create(array $data): Event
    {
        return DB::transaction(function () use ($data) {
            $fields = $data['custom_fields'] ?? [];
            unset($data['custom_fields']);
            $data['status'] = $data['status'] ?? 'PENDING';
            $event = Event::create($data);
            $this->replaceCustomFields($event, $fields);
            return $event->fresh(['speaker', 'customFields']);
        });
    }

    public function show(string $id): Event
    {
        return Event::with(['speaker', 'customFields'])->findOrFail($id);
    }

    public function update(string $id, array $data): Event
    {
        return DB::transaction(function () use ($id, $data) {
            $event = Event::findOrFail($id);
            $fields = $data['custom_fields'] ?? null;
            unset($data['custom_fields']);
            $event->update(array_filter($data, fn ($value) => $value !== null));
            if (is_array($fields)) $this->replaceCustomFields($event, $fields);
            return $event->fresh(['speaker', 'customFields']);
        });
    }

    public function delete(string $id): void
    {
        Event::findOrFail($id)->delete();
    }

    public function changeStatus(string $id, string $status): Event
    {
        $event = Event::findOrFail($id);
        $event->update(['status' => $status]);
        return $event->fresh(['speaker', 'customFields']);
    }

    public function syncCustomFields(string $id, array $fields)
    {
        $event = Event::findOrFail($id);
        $this->replaceCustomFields($event, $fields);
        return $event->customFields()->get();
    }

    public function uploadPoster(string $id, UploadedFile $file): string
    {
        $event = Event::findOrFail($id);
        $url = EventUploadHelper::storePoster($event->id, $file);
        $event->update(['poster_path' => $url]);
        return $url;
    }

    public function participants(string $id, array $filters): LengthAwarePaginator
    {
        $query = Event::findOrFail($id)->participants()->with(['event', 'crew', 'guest', 'payment']);
        if (!empty($filters['payment_status'])) $query->where('payment_status', $filters['payment_status']);
        if (!empty($filters['attendance_status'])) $query->where('attendance_status', $filters['attendance_status']);
        return $query->latest('created_at')->paginate((int) ($filters['per_page'] ?? 50));
    }

    public function stats(string $id): array
    {
        $participants = Event::findOrFail($id)->participants();
        return [
            'total_registered' => (clone $participants)->count(),
            'paid' => (clone $participants)->where('payment_status', 'Paid')->count(),
            'pending_payment' => (clone $participants)->where('payment_status', 'Pending_Approval')->count(),
            'attended' => (clone $participants)->where('attendance_status', 'Attended')->count(),
        ];
    }

    public function exportCsv(string $id): StreamedResponse
    {
        $event = Event::findOrFail($id);
        $rows = $event->participants()->with(['crew', 'guest'])->get();
        return response()->stream(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Nama', 'Jalur', 'Pembayaran', 'Kehadiran', 'QR Token']);
            foreach ($rows as $row) fputcsv($handle, [$row->display_name, $row->registration_path, $row->payment_status, $row->attendance_status, $row->qr_token]);
            fclose($handle);
        }, 200, ['Content-Type' => 'text/csv', 'Content-Disposition' => "attachment; filename=\"peserta-{$event->id}.csv\""]);
    }

    private function replaceCustomFields(Event $event, array $fields): void
    {
        $event->customFields()->delete();
        foreach (array_values($fields) as $index => $field) {
            EventCustomField::create([
                'event_id' => $event->id,
                'label' => $field['label'],
                'type' => $field['type'],
                'options' => $field['options'] ?? [],
                'is_required' => $field['is_required'] ?? false,
                'order_num' => $index,
            ]);
        }
    }
}
