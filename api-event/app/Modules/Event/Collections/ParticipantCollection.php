<?php

namespace App\Modules\Event\Collections;

use App\Modules\Event\Resources\ParticipantResource;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ParticipantCollection extends ResourceCollection
{
    public $collects = ParticipantResource::class;
}
