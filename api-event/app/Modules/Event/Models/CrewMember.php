<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CrewMember extends Model
{
    use HasUuids;

    protected $table = 'crew_members';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['niam', 'full_name', 'unit', 'photo_path'];
}
