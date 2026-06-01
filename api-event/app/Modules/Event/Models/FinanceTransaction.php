<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FinanceTransaction extends Model
{
    use HasUuids;

    protected $table = 'event_finance_transactions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_id', 'type', 'source', 'title', 'description', 'amount',
        'status', 'transaction_date', 'participant_id', 'payment_id',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'amount' => 'integer',
        'transaction_date' => 'datetime',
    ];
}
