<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateQueryToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If Bearer token is not in header, check query parameters: token, api_token, bearer_token
        if (!$request->header('Authorization')) {
            $token = $request->query('token') 
                ?? $request->query('api_token') 
                ?? $request->query('bearer_token');

            if ($token && is_string($token)) {
                $request->headers->set('Authorization', 'Bearer ' . trim($token));
            }
        }

        return $next($request);
    }
}
