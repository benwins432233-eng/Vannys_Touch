<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Toujours laisser passer les requêtes OPTIONS (CORS preflight)
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return $next($request);
    }
}