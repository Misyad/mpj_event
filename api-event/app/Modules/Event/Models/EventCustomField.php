<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventCustomField extends Model
{
    use HasUuids;

    protected $table = 'event_custom_fields';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['event_id', 'label', 'type', 'options', 'is_required', 'order_num'];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'order_num' => 'integer',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }
}
