<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidateController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\JobOpeningController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\PayslipController;
use App\Http\Controllers\Api\RecruiterController;
use App\Http\Controllers\Api\ResumeController;
use App\Http\Controllers\Api\SavedFilterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login'])->name('login')->middleware('throttle:10,1');

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile & logout
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard Statistics & Clean-up (real-time from database)
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::post('/dashboard/clean-database', [DashboardController::class, 'cleanDatabase']);

    // Candidate Management & Search
    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::post('/candidates', [CandidateController::class, 'store']);
    Route::get('/candidates/export', [CandidateController::class, 'exportCsv']);
    Route::post('/candidates/check-duplicate', [CandidateController::class, 'checkDuplicate']);
    Route::post('/candidates/bulk-status', [CandidateController::class, 'bulkStatusUpdate']);
    Route::get('/candidates/{id}', [CandidateController::class, 'show']);
    Route::put('/candidates/{id}', [CandidateController::class, 'update']);
    Route::delete('/candidates/{id}', [CandidateController::class, 'destroy']);

    // Candidate Recruiter Notes
    Route::post('/candidates/{id}/notes', [NoteController::class, 'store']);
    Route::delete('/notes/{id}', [NoteController::class, 'destroy']);

    // Resume Repository & Extraction
    Route::apiResource('payslips', PayslipController::class)->except(['create', 'edit']);

    // Resume Repository & Extraction
    Route::get('/resumes', [ResumeController::class, 'index']);
    Route::post('/resumes/upload-parse', [ResumeController::class, 'uploadAndParse']);
    Route::post('/resumes/bulk-upload-parse', [ResumeController::class, 'bulkUploadAndParse']);
    Route::get('/resumes/{id}', [ResumeController::class, 'show']);
    Route::post('/resumes/{id}/retry', [ResumeController::class, 'retryExtraction']);
    Route::get('/resumes/{id}/download', [ResumeController::class, 'download']);
    Route::get('/resumes/{id}/preview', [ResumeController::class, 'preview']);
    Route::delete('/resumes/{id}', [ResumeController::class, 'destroy']);


    // Recruiter Management (Admin/Recruiter)
    Route::get('/recruiters', [RecruiterController::class, 'index']);
    Route::post('/recruiters', [RecruiterController::class, 'store']);
    Route::patch('/recruiters/{id}/toggle-active', [RecruiterController::class, 'toggleActive']);
    Route::post('/recruiters/assign', [RecruiterController::class, 'assignCandidates']);

    // Saved Filter Presets
    Route::get('/saved-filters', [SavedFilterController::class, 'index']);
    Route::post('/saved-filters', [SavedFilterController::class, 'store']);
    Route::delete('/saved-filters/{id}', [SavedFilterController::class, 'destroy']);

    // Job Openings & Candidate Matching
    Route::get('/job-openings', [JobOpeningController::class, 'index']);
    Route::post('/job-openings', [JobOpeningController::class, 'store']);
    Route::get('/job-openings/{id}', [JobOpeningController::class, 'show']);
    Route::put('/job-openings/{id}', [JobOpeningController::class, 'update']);
    Route::delete('/job-openings/{id}', [JobOpeningController::class, 'destroy']);
    Route::get('/job-openings/{id}/match', [JobOpeningController::class, 'matchCandidates']);
    Route::post('/job-openings/{id}/apply', [JobOpeningController::class, 'applyCandidate']);
});
