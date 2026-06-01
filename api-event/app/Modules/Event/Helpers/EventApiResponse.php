<?php

namespace App\Modules\Event\Helpers;

use Illuminate\Http\JsonResponse;

class EventApiResponse
{
    public static function success(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        $payload = [];

        if ($message !== null) {
            $payload['success'] = true;
            $payload['message'] = $message;
        }

        if ($data !== null) {
            $payload['data'] = $data;
        }

        return response()->json($payload, $status);
    }

    public static function message(string $message, int $status = 200, array $extra = []): JsonResponse
    {
        return response()->json(array_merge([
            'success' => $status < 400,
            'message' => $message,
        ], $extra), $status);
    }
}
