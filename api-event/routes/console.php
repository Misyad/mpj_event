<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('about:event-api', function () {
    $this->info('MPJ Event API module is installed.');
});
