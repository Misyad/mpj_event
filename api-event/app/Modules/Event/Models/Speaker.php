<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Speaker extends Model
{
    use HasUuids;

    protected $table = 'speakers';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama_lengkap', 'alamat', 'keahlian', 'no_telp', 'portfolio_url',
        'kategori', 'foto_path', 'bio',
    ];

    protected $casts = ['keahlian' => 'array'];
}
