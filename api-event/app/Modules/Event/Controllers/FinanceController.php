<?php

namespace App\Modules\Event\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Event\Helpers\EventApiResponse;
use App\Modules\Event\Requests\FinanceTransactionRequest;
use App\Modules\Event\Resources\FinanceTransactionResource;
use App\Modules\Event\Services\FinanceService;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function __construct(private readonly FinanceService $finance) {}

    public function summary(Request $request) { return EventApiResponse::success($this->finance->summary($request->query('event_id'))); }
    public function recap() { return EventApiResponse::success($this->finance->recap()); }
    public function transactions(string $eventId) { return FinanceTransactionResource::collection($this->finance->transactions($eventId)); }
    public function store(FinanceTransactionRequest $request, string $eventId) { return EventApiResponse::success(new FinanceTransactionResource($this->finance->create($eventId, $request->validated())), 'Transaksi event dibuat.', 201); }
    public function update(FinanceTransactionRequest $request, string $eventId, string $transactionId) { return EventApiResponse::success(new FinanceTransactionResource($this->finance->update($eventId, $transactionId, $request->validated())), 'Transaksi event diperbarui.'); }
    public function void(string $eventId, string $transactionId) { $this->finance->void($eventId, $transactionId); return EventApiResponse::message('Transaksi event dibatalkan.'); }
    public function export(Request $request) { return $this->finance->export($request->query('event_id')); }
}
