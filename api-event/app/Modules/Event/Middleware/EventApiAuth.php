<?php

namespace App\Modules\Event\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EventApiAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) env('EVENT_API_TOKEN', 'mpj-event-admin-token');
        $provided = $request->bearerToken() ?: $request->header('x-admin-token', '');

        if ($expected === '' || !hash_equals($expected, (string) $provided)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return $next($request);
    }
}
