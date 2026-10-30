<?php

use Illuminate\Support\Facades\Route;

$serveSpa = function () {
    if (file_exists(public_path('index.html'))) {
        return response()->file(public_path('index.html'));
    }
    return response()->json([
        'message' => 'Jobbycart ATS API Server is running.',
        'version' => '1.0.0',
    ]);
};

Route::get('/', $serveSpa);
Route::get('/ats', $serveSpa);

Route::get('/ats/clear-cache', function () {
    \Illuminate\Support\Facades\Artisan::call('route:clear');
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
    return response()->json([
        'status' => 'success',
        'message' => 'Route, config, and application cache cleared successfully!',
    ]);
});
Route::get('/clear-cache', function () {
    \Illuminate\Support\Facades\Artisan::call('route:clear');
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
    return response()->json([
        'status' => 'success',
        'message' => 'Route, config, and application cache cleared successfully!',
    ]);
});
Route::get('/ats/{any}', $serveSpa)->where('any', '^(?!api|clear-cache).*$');
Route::get('/{any}', $serveSpa)->where('any', '^(?!api|ats/api|clear-cache|install\.php|fix\.php|clean-database\.php).*$');