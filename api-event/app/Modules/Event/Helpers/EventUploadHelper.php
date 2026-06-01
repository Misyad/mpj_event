<?php

namespace App\Modules\Event\Helpers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventUploadHelper
{
    public static function storePoster(string $eventId, UploadedFile $file): string
    {
        return Storage::url($file->store("event/posters/{$eventId}", 'public'));
    }

    public static function storePaymentProof(string $eventId, string $participantId, UploadedFile $file): string
    {
        $extension = strtolower($file->extension() ?: $file->guessExtension() ?: 'jpg');
        $filename = now()->format('YmdHis').'-'.Str::uuid().'.'.$extension;

        return $file->storeAs("event/payment-proofs/{$eventId}/{$participantId}", $filename, 'local');
    }

    public static function storeIdentityPhoto(string $eventId, UploadedFile $file): string
    {
        return Storage::url($file->store("event/id-photos/{$eventId}", 'public'));
    }

    public static function storedFile(?string $value): ?array
    {
        if (!$value) {
            return null;
        }

        $path = trim($value);

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $path = (string) parse_url($path, PHP_URL_PATH);
        }

        if (str_starts_with($path, '/storage/')) {
            return ['disk' => 'public', 'path' => ltrim(substr($path, strlen('/storage/')), '/')];
        }

        if (str_starts_with($path, 'storage/')) {
            return ['disk' => 'public', 'path' => substr($path, strlen('storage/'))];
        }

        return ['disk' => 'local', 'path' => ltrim($path, '/')];
    }

    public static function deleteStoredFile(?string $value): void
    {
        $file = self::storedFile($value);
        if ($file && Storage::disk($file['disk'])->exists($file['path'])) {
            Storage::disk($file['disk'])->delete($file['path']);
        }
    }
}
