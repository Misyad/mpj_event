<?php

namespace App\Modules\Event\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $table = 'event_attendance_logs';

    protected $fillable = [
        'event_id', 'participant_id', 'qr_token', 'scanned_by_name',
        'scanner_device', 'scanned_at', 'success', 'failure_reason',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'success' => 'boolean',
    ];
}
