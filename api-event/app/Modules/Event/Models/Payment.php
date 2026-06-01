<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasUuids;

    protected $table = 'payments';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'participant_id', 'amount', 'status', 'proof_path', 'submitted_at',
        'verified_by', 'verified_at', 'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'integer',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(EventParticipant::class, 'participant_id');
    }
}
