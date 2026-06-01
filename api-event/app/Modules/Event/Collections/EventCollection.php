<?php

namespace App\Modules\Event\Collections;

use App\Modules\Event\Resources\EventResource;
use Illuminate\Http\Resources\Json\ResourceCollection;

class EventCollection extends ResourceCollection
{
    public $collects = EventResource::class;
}
