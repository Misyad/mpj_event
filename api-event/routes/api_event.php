<?php

use App\Modules\Event\Controllers\AttendanceController;
use App\Modules\Event\Controllers\EventController;
use App\Modules\Event\Controllers\FinanceController;
use App\Modules\Event\Controllers\PaymentController;
use App\Modules\Event\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

Route::prefix('event')->group(function () {
    Route::get('/', [EventController::class, 'index']);
    Route::get('/niam/validate/{niam}', [RegistrationController::class, 'validateNiam']);
    Route::get('/ticket/{token}', [RegistrationController::class, 'ticket']);
    Route::post('/{id}/register', [RegistrationController::class, 'register']);
    Route::post('/payment/proof', [PaymentController::class, 'uploadProof']);
    Route::get('/{id}', [EventController::class, 'show']);
});

Route::middleware('event.auth')->prefix('event')->group(function () {
    Route::get('/admin/list', [EventController::class, 'adminIndex']);
    Route::post('/admin', [EventController::class, 'store']);
    Route::get('/admin/{id}', [EventController::class, 'adminShow']);
    Route::put('/admin/{id}', [EventController::class, 'update']);
    Route::delete('/admin/{id}', [EventController::class, 'destroy']);
    Route::patch('/admin/{id}/status', [EventController::class, 'changeStatus']);
    Route::post('/admin/{id}/custom-fields', [EventController::class, 'syncCustomFields']);
    Route::post('/admin/{id}/poster', [EventController::class, 'uploadPoster']);
    Route::get('/admin/{id}/participants', [EventController::class, 'participants']);
    Route::get('/admin/{id}/stats', [EventController::class, 'stats']);
    Route::get('/admin/{id}/export-csv', [EventController::class, 'exportCsv']);
    Route::get('/admin/payments/{participantId}/proof', [PaymentController::class, 'proofPreview']);
    Route::post('/admin/payments/{participantId}/approve', [PaymentController::class, 'approve']);
    Route::post('/admin/payments/{participantId}/reject', [PaymentController::class, 'reject']);
    Route::post('/payment/{paymentId}/approve', [PaymentController::class, 'approvePayment']);
    Route::post('/payment/{paymentId}/reject', [PaymentController::class, 'rejectPayment']);
    Route::post('/admin/participants/{participantId}/cancel', [AttendanceController::class, 'cancel']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::get('/attendance/{eventId}/log', [AttendanceController::class, 'log']);
    Route::get('/attendance/verify/{token}', [AttendanceController::class, 'verify']);
    Route::get('/finance/summary', [FinanceController::class, 'summary']);
    Route::get('/finance/recap', [FinanceController::class, 'recap']);
    Route::get('/finance/export', [FinanceController::class, 'export']);
    Route::get('/{eventId}/finance/transactions', [FinanceController::class, 'transactions']);
    Route::post('/{eventId}/finance/transactions', [FinanceController::class, 'store']);
    Route::put('/{eventId}/finance/transactions/{transactionId}', [FinanceController::class, 'update']);
    Route::post('/{eventId}/finance/transactions/{transactionId}/void', [FinanceController::class, 'void']);
});
