<?php

namespace App\Modules\Event\Services;

use App\Modules\Event\Models\Event;
use App\Modules\Event\Models\FinanceTransaction;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceService
{
    public function summary(?string $eventId = null): array
    {
        $query = FinanceTransaction::where('status', 'posted');
        if ($eventId) $query->where('event_id', $eventId);
        $income = (clone $query)->where('type', 'income')->sum('amount');
        $expense = (clone $query)->where('type', 'expense')->sum('amount');
        return ['income' => (int) $income, 'expense' => (int) $expense, 'balance' => (int) $income - (int) $expense];
    }

    public function recap(): array
    {
        return Event::query()->get()->map(fn ($event) => [
            'event' => ['id' => $event->id, 'title' => $event->title],
            'finance' => $this->summary($event->id),
        ])->values()->all();
    }

    public function transactions(string $eventId)
    {
        return FinanceTransaction::where('event_id', $eventId)->latest('transaction_date')->paginate(50);
    }

    public function create(string $eventId, array $data): FinanceTransaction
    {
        Event::findOrFail($eventId);
        return FinanceTransaction::create($data + ['event_id' => $eventId, 'source' => 'manual', 'status' => 'posted']);
    }

    public function update(string $eventId, string $transactionId, array $data): FinanceTransaction
    {
        $transaction = FinanceTransaction::where('event_id', $eventId)->where('id', $transactionId)->firstOrFail();
        if ($transaction->source !== 'manual') abort(response()->json(['message' => 'Transaksi payment tidak bisa diedit manual.'], 422));
        $transaction->update($data);
        return $transaction->fresh();
    }

    public function void(string $eventId, string $transactionId): void
    {
        $transaction = FinanceTransaction::where('event_id', $eventId)->where('id', $transactionId)->firstOrFail();
        if ($transaction->source !== 'manual') abort(response()->json(['message' => 'Transaksi payment tidak bisa di-void manual.'], 422));
        $transaction->update(['status' => 'void']);
    }

    public function export(?string $eventId = null): StreamedResponse
    {
        $query = FinanceTransaction::where('status', 'posted')->latest('transaction_date');
        if ($eventId) $query->where('event_id', $eventId);
        $rows = $query->get();
        return response()->stream(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Tanggal', 'Event ID', 'Tipe', 'Sumber', 'Judul', 'Nominal']);
            foreach ($rows as $row) fputcsv($handle, [$row->transaction_date, $row->event_id, $row->type, $row->source, $row->title, $row->amount]);
            fclose($handle);
        }, 200, ['Content-Type' => 'text/csv', 'Content-Disposition' => 'attachment; filename="event-finance.csv"']);
    }
}
