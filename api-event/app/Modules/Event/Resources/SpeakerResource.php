<?php

namespace App\Modules\Event\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SpeakerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_lengkap' => $this->nama_lengkap,
            'keahlian' => $this->keahlian ?? [],
            'no_telp' => $this->no_telp,
            'portfolio_url' => $this->portfolio_url,
            'kategori' => $this->kategori,
            'foto_path' => $this->foto_path,
            'bio' => $this->bio,
        ];
    }
}
