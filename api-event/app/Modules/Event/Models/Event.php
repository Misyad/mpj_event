<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasUuids;

    protected $table = 'events';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'title', 'category', 'event_type', 'poster_path', 'description',
        'location_name', 'location_gmaps', 'start_date', 'registration_deadline',
        'is_open_for_public', 'is_paid', 'price_niam', 'price_public',
        'max_participants', 'current_participants', 'status_pendaftaran',
        'status', 'payment_method', 'gateway_provider', 'gateway_config',
        'bank_account_id', 'speaker_id', 'gdrive_lpj', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'registration_deadline' => 'datetime',
        'is_open_for_public' => 'boolean',
        'is_paid' => 'boolean',
        'gateway_config' => 'array',
        'price_niam' => 'integer',
        'price_public' => 'integer',
        'max_participants' => 'integer',
        'current_participants' => 'integer',
    ];

    public function customFields(): HasMany
    {
        return $this->hasMany(EventCustomField::class, 'event_id')->orderBy('order_num');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(EventParticipant::class, 'event_id');
    }

    public function speaker(): BelongsTo
    {
        return $this->belongsTo(Speaker::class, 'speaker_id');
    }

    public function scopePublicListing($query)
    {
        return $query->whereIn('status', ['APPROVED', 'LIVE', 'FINISHED', 'COMPLETED']);
    }

    public function getIsFullAttribute(): bool
    {
        return $this->max_participants !== null && $this->current_participants >= $this->max_participants;
    }
}
