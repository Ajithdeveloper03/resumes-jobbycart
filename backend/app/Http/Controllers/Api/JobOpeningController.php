<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateActivityLog;
use App\Models\CandidateApplication;
use App\Models\JobOpening;
use App\Models\JobRequiredSkill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobOpeningController extends Controller
{
    /**
     * List all job openings with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobOpening::with(['requiredSkills', 'creator:id,name']);

        if ($search = trim($request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $jobs = $query->withCount('applications')->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    /**
     * Create a new job opening.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'nullable|string|max:100',
            'client_name' => 'nullable|string|max:200',
            'location' => 'nullable|string|max:100',
            'min_experience' => 'nullable|numeric|min:0',
            'max_experience' => 'nullable|numeric|min:0',
            'qualification' => 'nullable|string|max:150',
            'employment_type' => 'nullable|string|in:full_time,part_time,contract,freelance,internship',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0',
            'vacancies' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'status' => 'nullable|string|in:draft,open,in_progress,closed',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:100',
        ]);

        $userId = $request->user()?->id;

        DB::beginTransaction();
        try {
            $job = JobOpening::create([
                'title' => $validated['title'],
                'department' => $validated['department'] ?? null,
                'client_name' => $validated['client_name'] ?? null,
                'location' => $validated['location'] ?? null,
                'min_experience' => $validated['min_experience'] ?? 0,
                'max_experience' => $validated['max_experience'] ?? null,
                'qualification' => $validated['qualification'] ?? null,
                'employment_type' => $validated['employment_type'] ?? 'full_time',
                'min_salary' => $validated['min_salary'] ?? null,
                'max_salary' => $validated['max_salary'] ?? null,
                'vacancies' => $validated['vacancies'] ?? 1,
                'description' => $validated['description'] ?? null,
                'priority' => $validated['priority'] ?? 'medium',
                'status' => $validated['status'] ?? 'open',
                'created_by' => $userId,
            ]);

            if (!empty($validated['skills'])) {
                foreach ($validated['skills'] as $skillName) {
                    if ($clean = trim($skillName)) {
                        JobRequiredSkill::create([
                            'job_opening_id' => $job->id,
                            'skill_name' => $clean,
                            'is_mandatory' => true,
                        ]);
                    }
                }
            }

            CandidateActivityLog::log(
                null,
                $userId,
                'job_created',
                "Job Opening '{$job->title}' created."
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Job opening created successfully.',
                'data' => $job->load('requiredSkills'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create job opening: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show single job opening.
     */
    public function show(int $id): JsonResponse
    {
        $job = JobOpening::with([
            'requiredSkills',
            'creator:id,name',
            'applications.candidate:id,full_name,email,phone,total_experience_years,current_title',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $job,
        ]);
    }

    /**
     * Update job opening.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $job = JobOpening::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'department' => 'nullable|string|max:100',
            'client_name' => 'nullable|string|max:200',
            'location' => 'nullable|string|max:100',
            'min_experience' => 'nullable|numeric|min:0',
            'max_experience' => 'nullable|numeric|min:0',
            'qualification' => 'nullable|string|max:150',
            'employment_type' => 'nullable|string|in:full_time,part_time,contract,freelance,internship',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0',
            'vacancies' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'status' => 'sometimes|string|in:draft,open,in_progress,closed',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:100',
        ]);

        DB::beginTransaction();
        try {
            $job->update($validated);

            if ($request->has('skills')) {
                JobRequiredSkill::where('job_opening_id', $job->id)->delete();
                foreach ($validated['skills'] ?? [] as $skillName) {
                    if ($clean = trim($skillName)) {
                        JobRequiredSkill::create([
                            'job_opening_id' => $job->id,
                            'skill_name' => $clean,
                            'is_mandatory' => true,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Job opening updated successfully.',
                'data' => $job->fresh('requiredSkills'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update job opening: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete job opening.
     */
    public function destroy(int $id): JsonResponse
    {
        $job = JobOpening::findOrFail($id);
        $title = $job->title;
        $job->delete();

        return response()->json([
            'success' => true,
            'message' => "Job Opening '{$title}' deleted successfully.",
        ]);
    }

    /**
     * Search & match candidates against job requirements.
     * Accurately calculates matched skills, missing skills, and experience fit without false AI claims.
     */
    public function matchCandidates(int $id): JsonResponse
    {
        $job = JobOpening::with('requiredSkills')->findOrFail($id);
        $requiredSkills = $job->requiredSkills->pluck('skill_name')->map('trim')->filter()->values()->all();

        $candidates = Candidate::with(['skills', 'latestResume'])
            ->where('candidate_status', '!=', 'rejected')
            ->get();

        $matches = [];

        foreach ($candidates as $candidate) {
            $candidateSkillNames = $candidate->skills->pluck('skill_name')->map(fn($s) => strtolower(trim($s)))->all();

            $matchingSkills = [];
            $missingSkills = [];

            foreach ($requiredSkills as $reqSkill) {
                $reqLower = strtolower($reqSkill);
                $found = false;
                foreach ($candidateSkillNames as $candSkill) {
                    if (str_contains($candSkill, $reqLower) || str_contains($reqLower, $candSkill)) {
                        $found = true;
                        break;
                    }
                }
                if ($found) {
                    $matchingSkills[] = $reqSkill;
                } else {
                    $missingSkills[] = $reqSkill;
                }
            }

            // Calculate skill match score
            $skillScore = !empty($requiredSkills) ? round((count($matchingSkills) / count($requiredSkills)) * 70, 1) : 40;

            // Experience match score (up to 30 points)
            $expScore = 0;
            $candExp = (float)$candidate->total_experience_years;
            $minExp = (float)$job->min_experience;
            $maxExp = (float)($job->max_experience ?? 30);

            if ($candExp >= $minExp && $candExp <= $maxExp) {
                $expScore = 30;
            } elseif ($candExp < $minExp) {
                $expScore = max(5, round(($candExp / max(1, $minExp)) * 25, 1));
            } else {
                $expScore = 25; // slightly overqualified
            }

            $totalScore = min(100, round($skillScore + $expScore, 1));

            // Only return candidates with some relevance (e.g. at least 1 skill match or score >= 35)
            if (count($matchingSkills) > 0 || $totalScore >= 35) {
                $matches[] = [
                    'candidate' => $candidate,
                    'match_score' => $totalScore,
                    'skill_match_percentage' => !empty($requiredSkills) ? round((count($matchingSkills) / count($requiredSkills)) * 100) : 100,
                    'matching_skills' => $matchingSkills,
                    'missing_skills' => $missingSkills,
                    'experience_fit' => ($candExp >= $minExp && $candExp <= $maxExp) ? 'Optimal' : ($candExp < $minExp ? 'Below Requirement' : 'Experienced'),
                ];
            }
        }

        // Sort by match_score descending
        usort($matches, fn($a, $b) => $b['match_score'] <=> $a['match_score']);

        return response()->json([
            'success' => true,
            'job' => $job,
            'matches' => array_slice($matches, 0, 50),
        ]);
    }

    /**
     * Link / apply candidate to job opening.
     */
    public function applyCandidate(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'candidate_id' => 'required|exists:candidates,id',
            'status' => 'nullable|string|in:applied,screening,shortlisted,interviewing,offered,hired,rejected',
            'notes' => 'nullable|string',
            'match_score' => 'nullable|numeric',
        ]);

        $app = CandidateApplication::updateOrCreate(
            [
                'candidate_id' => $validated['candidate_id'],
                'job_opening_id' => $id,
            ],
            [
                'status' => $validated['status'] ?? 'applied',
                'notes' => $validated['notes'] ?? null,
                'match_score' => $validated['match_score'] ?? null,
                'created_by' => $request->user()?->id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Candidate assigned to job opening successfully.',
            'data' => $app,
        ]);
    }
}
