<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EventGuest extends Model
{
    use HasUuids;

    protected $table = 'event_guests';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['full_name', 'institution_name', 'whatsapp', 'id_card_path'];
}
