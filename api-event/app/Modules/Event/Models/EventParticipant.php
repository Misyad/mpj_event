<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EventParticipant extends Model
{
    use HasUuids;

    protected $table = 'event_participants';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'event_id', 'crew_id', 'guest_id', 'registration_path', 'payment_status',
        'unique_amount', 'payment_proof_path', 'attendance_status', 'qr_token',
        'attended_at',
    ];

    protected $casts = [
        'unique_amount' => 'integer',
        'attended_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function crew(): BelongsTo
    {
        return $this->belongsTo(CrewMember::class, 'crew_id');
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(EventGuest::class, 'guest_id');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class, 'participant_id');
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->registration_path === 'NIAM'
            ? ($this->crew?->full_name ?? '-')
            : ($this->guest?->full_name ?? '-');
    }
}
