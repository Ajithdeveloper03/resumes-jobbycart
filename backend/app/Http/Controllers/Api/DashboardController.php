<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class DashboardController extends Controller
{
    /**
     * Get real dashboard statistics directly from MySQL database.
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $now = now();
            $startOfMonth = $now->copy()->startOfMonth();

            // 1. Core metric counts
            $totalCandidates = Candidate::count();
            $totalResumes = Resume::count();
            $candidatesThisMonth = Candidate::where('created_at', '>=', $startOfMonth)->count();
            $awaitingReview = Candidate::where(function ($query) {
                $query->where('is_verified', false)
                      ->orWhere('extraction_status', 'needs_review');
            })->count();

            // 2. Candidates grouped by job role
            $byJobRole = Candidate::select('primary_role', DB::raw('count(*) as count'))
                ->whereNotNull('primary_role')
                ->where('primary_role', '!=', '')
                ->groupBy('primary_role')
                ->orderByDesc('count')
                ->limit(7)
                ->get();

            // 3. Candidates grouped by experience range
            $experienceRanges = [
                '0-1 Year (Entry)' => Candidate::where('total_experience_years', '<=', 1)->count(),
                '1-3 Years (Junior)' => Candidate::whereBetween('total_experience_years', [1.1, 3])->count(),
                '3-5 Years (Mid-level)' => Candidate::whereBetween('total_experience_years', [3.1, 5])->count(),
                '5-8 Years (Senior)' => Candidate::whereBetween('total_experience_years', [5.1, 8])->count(),
                '8+ Years (Lead/Architect)' => Candidate::where('total_experience_years', '>', 8)->count(),
            ];

            // 4. Candidates grouped by location
            $byLocation = Candidate::select('city', DB::raw('count(*) as count'))
                ->whereNotNull('city')
                ->where('city', '!=', '')
                ->groupBy('city')
                ->orderByDesc('count')
                ->limit(7)
                ->get();

            // 5. Candidate status breakdown
            $byStatus = Candidate::select('candidate_status', DB::raw('count(*) as count'))
                ->groupBy('candidate_status')
                ->get()
                ->pluck('count', 'candidate_status');

            // 6. Recently added candidates
            $recentCandidates = Candidate::with(['latestResume', 'assignedRecruiter'])
                ->latest()
                ->limit(6)
                ->get();

            // 7. Recently uploaded resumes
            $recentResumes = Resume::with('candidate')
                ->latest()
                ->limit(6)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_candidates' => $totalCandidates,
                        'total_resumes' => $totalResumes,
                        'candidates_this_month' => $candidatesThisMonth,
                        'awaiting_review' => $awaitingReview,
                    ],
                    'by_job_role' => $byJobRole,
                    'by_experience' => $experienceRanges,
                    'by_location' => $byLocation,
                    'by_status' => $byStatus,
                    'recent_candidates' => $recentCandidates,
                    'recent_resumes' => $recentResumes,
                ],
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR)
              ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
              ->header('Pragma', 'no-cache');
        } catch (\Throwable $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate stats: ' . $e->getMessage(),
                'data' => [
                    'overview' => [
                        'total_candidates' => Candidate::count(),
                        'total_resumes' => Resume::count(),
                        'candidates_this_month' => 0,
                        'awaiting_review' => 0,
                    ],
                    'by_job_role' => [],
                    'by_experience' => [],
                    'by_location' => [],
                    'by_status' => [],
                    'recent_candidates' => [],
                    'recent_resumes' => [],
                ]
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE)->header('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
    }

    /**
     * Clean up and reset talent database and uploaded files so user can start fresh.
     */
    public function cleanDatabase(Request $request): JsonResponse
    {
        try {
            $candidateTables = [
                'candidate_skills',
                'candidate_education',
                'candidate_employment_history',
                'candidate_employment_histories',
                'candidate_certifications',
                'candidate_languages',
                'candidate_applications',
                'candidate_notes',
                'candidate_activity_logs',
                'resumes',
                'candidates',
            ];

            Schema::disableForeignKeyConstraints();
            foreach ($candidateTables as $table) {
                try {
                    if (Schema::hasTable($table)) {
                        DB::table($table)->truncate();
                    }
                } catch (\Throwable $te) {
                    try {
                        if (Schema::hasTable($table)) {
                            DB::table($table)->delete();
                        }
                    } catch (\Throwable $de) {
                        Log::warning("Table cleanup warning for {$table}: " . $de->getMessage());
                    }
                }
            }
            Schema::enableForeignKeyConstraints();

            // Clean physical files in storage
            try {
                foreach (['resumes', 'private/resumes'] as $dir) {
                    foreach (['local', 'public'] as $disk) {
                        try {
                            $files = Storage::disk($disk)->allFiles($dir);
                            foreach ($files as $file) {
                                if (!str_ends_with($file, '.gitignore') && !str_contains($file, 'sample_')) {
                                    Storage::disk($disk)->delete($file);
                                }
                            }
                        } catch (\Throwable $inner) {}
                    }
                }
            } catch (\Throwable $fe) {
                Log::warning('Storage file cleanup note: ' . $fe->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Talent database and uploaded files have been cleaned up successfully. You can now start fresh!',
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE)->header('Cache-Control', 'no-store, no-cache, must-revalidate');
        } catch (\Throwable $e) {
            try {
                Schema::enableForeignKeyConstraints();
            } catch (\Throwable $_) {}
            Log::error('Clean database failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Clean database failed: ' . $e->getMessage(),
            ], 500, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }
    }
}
