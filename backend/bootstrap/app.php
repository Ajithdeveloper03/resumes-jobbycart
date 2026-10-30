<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Also register API routes under ats/api prefix for Hostinger subfolder deployments
            Route::middleware('api')
                ->prefix('ats/api')
                ->group(__DIR__.'/../routes/api.php');
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('api', \App\Http\Middleware\AuthenticateQueryToken::class);
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('ats/api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated or session expired. Please log in again.',
                ], 401);
            }
        });
    })->create();
