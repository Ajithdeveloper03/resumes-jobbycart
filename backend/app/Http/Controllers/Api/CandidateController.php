<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateActivityLog;
use App\Models\CandidateCertification;
use App\Models\CandidateEducation;
use App\Models\CandidateEmploymentHistory;
use App\Models\CandidateLanguage;
use App\Models\CandidateSkill;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CandidateController extends Controller
{
    /**
     * Display a filtered list of candidates with pagination and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Candidate::query()->with([
                'skills',
                'resumes',
                'latestResume',
                'assignedRecruiter:id,name,email',
                'education:id,candidate_id,degree,institution,graduation_year',
            ]);

            $this->applyFilters($query, $request);

            // Sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = strtolower($request->input('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

            $allowedSorts = [
                'created_at', 'full_name', 'total_experience_years',
                'current_company', 'primary_role', 'notice_period_days', 'candidate_status'
            ];

            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            $perPage = min(100, max(5, (int)$request->input('per_page', 15)));
            $candidates = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $candidates,
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR)
              ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
              ->header('Pragma', 'no-cache');
        } catch (\Throwable $e) {
            Log::error('Candidate listing failed: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load candidates: ' . $e->getMessage(),
            ], 500, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }
    }

    /**
     * Apply all advanced search & filtering conditions across the 8 strictly requested candidate fields.
     */
    protected function applyFilters($query, Request $request): void
    {
        // 1. Global Search (name, email, phone, role, location, education, skills)
        if ($search = trim($request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('alternate_phone', 'like', "%{$search}%")
                  ->orWhere('primary_role', 'like', "%{$search}%")
                  ->orWhere('current_title', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('current_location', 'like', "%{$search}%")
                  ->orWhere('state', 'like', "%{$search}%")
                  ->orWhere('highest_qualification', 'like', "%{$search}%")
                  ->orWhere('degree', 'like', "%{$search}%")
                  ->orWhereHas('skills', function ($sq) use ($search) {
                      $sq->where('skill_name', 'like', "%{$search}%")
                         ->orWhere('normalized_skill_name', 'like', "%{$search}%");
                  });

                // If search query is numeric (e.g. searching "5" or "3.5" years of experience)
                if (is_numeric($search)) {
                    $num = (float)$search;
                    $q->orWhereBetween('total_experience_years', [$num - 0.5, $num + 0.5]);
                }
            });
        }

        // 2. Job Roles Filter (matches primary_role or current_title flexibly)
        $roles = $request->input('roles', $request->input('role'));
        if (is_string($roles) && strlen($roles)) {
            $roles = array_filter(array_map('trim', explode(',', $roles)));
        }
        if (is_array($roles) && !empty($roles)) {
            $query->where(function ($q) use ($roles) {
                foreach ($roles as $r) {
                    $q->orWhere('primary_role', 'like', "%{$r}%")
                      ->orWhere('current_title', 'like', "%{$r}%");
                }
            });
        }

        // 3. Experience Range
        if ($request->filled('min_experience') && is_numeric($request->input('min_experience'))) {
            $query->where('total_experience_years', '>=', (float)$request->input('min_experience'));
        }
        if ($request->filled('max_experience') && is_numeric($request->input('max_experience'))) {
            $query->where('total_experience_years', '<=', (float)$request->input('max_experience'));
        }

        // 4. Locations Filter (city, state, current_location)
        $locations = $request->input('locations', $request->input('location'));
        if (is_string($locations) && strlen($locations)) {
            $locations = array_filter(array_map('trim', explode(',', $locations)));
        }
        if (is_array($locations) && !empty($locations)) {
            $query->where(function ($q) use ($locations) {
                foreach ($locations as $loc) {
                    $q->orWhere('city', 'like', "%{$loc}%")
                      ->orWhere('current_location', 'like', "%{$loc}%")
                      ->orWhere('state', 'like', "%{$loc}%");
                }
            });
        }

        // 5. Skills with flexible AND/OR logic
        $skills = $request->input('skills', $request->input('skill'));
        if (is_string($skills) && strlen($skills)) {
            $skills = array_filter(array_map('trim', explode(',', $skills)));
        }
        $skillOperator = strtoupper($request->input('skill_operator', 'AND')) === 'OR' ? 'OR' : 'AND';

        if (is_array($skills) && !empty($skills)) {
            if ($skillOperator === 'AND') {
                foreach ($skills as $skill) {
                    $query->whereHas('skills', function ($q) use ($skill) {
                        $q->where('skill_name', 'like', "%{$skill}%")
                          ->orWhere('normalized_skill_name', 'like', "%{$skill}%");
                    });
                }
            } else {
                $query->whereHas('skills', function ($q) use ($skills) {
                    $q->where(function ($sq) use ($skills) {
                        foreach ($skills as $skill) {
                            $sq->orWhere('skill_name', 'like', "%{$skill}%")
                               ->orWhere('normalized_skill_name', 'like', "%{$skill}%");
                        }
                    });
                });
            }
        }

        // 6. Highest Qualification / Degree
        if ($request->filled('qualification')) {
            $qual = trim($request->input('qualification'));
            $query->where(function ($q) use ($qual) {
                $q->where('highest_qualification', 'like', "%{$qual}%")
                  ->orWhere('degree', 'like', "%{$qual}%");
            });
        }

        // 7. Current / Previous Company
        if ($request->filled('company')) {
            $comp = trim($request->input('company'));
            $query->where(function ($q) use ($comp) {
                $q->where('current_company', 'like', "%{$comp}%")
                  ->orWhereHas('employmentHistory', function ($eh) use ($comp) {
                      $eh->where('company_name', 'like', "%{$comp}%");
                  });
            });
        }

        // 8. Notice Period (max days, e.g. 15, 30, 60 days)
        if ($request->filled('max_notice_days')) {
            $maxDays = (int)$request->input('max_notice_days');
            $query->where(function ($q) use ($maxDays) {
                $q->where('notice_period_days', '<=', $maxDays)
                  ->orWhereNull('notice_period_days');
            });
        }

        // 9. Candidate Status (single or multiple)
        $statuses = $request->input('statuses');
        if (is_string($statuses) && strlen($statuses)) {
            $statuses = explode(',', $statuses);
        }
        if (is_array($statuses) && !empty($statuses)) {
            $query->whereIn('candidate_status', $statuses);
        }

        // 10. Assigned Recruiter
        if ($request->filled('recruiter_id')) {
            $query->where('assigned_recruiter_id', $request->input('recruiter_id'));
        }

        // 11. Salary Range
        if ($request->filled('min_expected_salary')) {
            $query->where('expected_salary', '>=', (float)$request->input('min_expected_salary'));
        }
        if ($request->filled('max_expected_salary')) {
            $query->where('expected_salary', '<=', (float)$request->input('max_expected_salary'));
        }

        // 12. Verification Status
        if ($request->filled('is_verified')) {
            $query->where('is_verified', filter_var($request->input('is_verified'), FILTER_VALIDATE_BOOLEAN));
        }

        // 13. Has Resume attachment
        if ($request->filled('has_resume')) {
            $hasResume = filter_var($request->input('has_resume'), FILTER_VALIDATE_BOOLEAN);
            if ($hasResume) {
                $query->has('resumes');
            } else {
                $query->doesntHave('resumes');
            }
        }

        // 14. Date Added Range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_date'));
        }
    }

    /**
     * Store a newly approved candidate (review & save workflow).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'alternate_phone' => 'nullable|string|max:30',
            'current_location' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'linkedin_url' => 'nullable|string|max:255',
            'portfolio_url' => 'nullable|string|max:255',
            'github_url' => 'nullable|string|max:255',
            'current_title' => 'nullable|string|max:150',
            'primary_role' => 'nullable|string|max:150',
            'total_experience_years' => 'nullable|numeric|min:0|max:50',
            'relevant_experience_years' => 'nullable|numeric|min:0|max:50',
            'current_company' => 'nullable|string|max:200',
            'highest_qualification' => 'nullable|string|max:150',
            'degree' => 'nullable|string|max:150',
            'specialization' => 'nullable|string|max:150',
            'current_salary' => 'nullable|numeric|min:0',
            'expected_salary' => 'nullable|numeric|min:0',
            'notice_period_days' => 'nullable|integer|min:0|max:365',
            'notice_period_text' => 'nullable|string|max:100',
            'availability_date' => 'nullable|date',
            'candidate_status' => 'nullable|string|in:new,screening,shortlisted,interviewing,offered,hired,rejected,archived',
            'source' => 'nullable|string|max:100',
            'assigned_recruiter_id' => 'nullable|exists:users,id',
            'professional_summary' => 'nullable|string',
            'is_verified' => 'nullable|boolean',
            'extraction_status' => 'nullable|string',
            'resume_id' => 'nullable|exists:resumes,id',
            'skills' => 'nullable|array',
            'education' => 'nullable|array',
            'employment_history' => 'nullable|array',
            'certifications' => 'nullable|array',
            'languages' => 'nullable|array',
        ]);

        $userId = $request->user()?->id;

        DB::beginTransaction();
        try {
            // Create Candidate record
            $candidate = Candidate::create([
                'full_name' => $validated['full_name'],
                'first_name' => $validated['first_name'] ?? null,
                'last_name' => $validated['last_name'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'alternate_phone' => $validated['alternate_phone'] ?? null,
                'current_location' => $validated['current_location'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'country' => $validated['country'] ?? 'India',
                'linkedin_url' => $validated['linkedin_url'] ?? null,
                'portfolio_url' => $validated['portfolio_url'] ?? null,
                'github_url' => $validated['github_url'] ?? null,
                'current_title' => $validated['current_title'] ?? null,
                'primary_role' => $validated['primary_role'] ?? null,
                'total_experience_years' => $validated['total_experience_years'] ?? 0,
                'relevant_experience_years' => $validated['relevant_experience_years'] ?? $validated['total_experience_years'] ?? 0,
                'current_company' => $validated['current_company'] ?? null,
                'highest_qualification' => $validated['highest_qualification'] ?? null,
                'degree' => $validated['degree'] ?? null,
                'specialization' => $validated['specialization'] ?? null,
                'current_salary' => $validated['current_salary'] ?? null,
                'expected_salary' => $validated['expected_salary'] ?? null,
                'notice_period_days' => $validated['notice_period_days'] ?? null,
                'notice_period_text' => $validated['notice_period_text'] ?? null,
                'availability_date' => $validated['availability_date'] ?? null,
                'candidate_status' => $validated['candidate_status'] ?? 'new',
                'source' => $validated['source'] ?? 'manual_review',
                'assigned_recruiter_id' => $validated['assigned_recruiter_id'] ?? $userId,
                'professional_summary' => $validated['professional_summary'] ?? null,
                'extraction_status' => $validated['extraction_status'] ?? 'verified',
                'is_verified' => $validated['is_verified'] ?? true,
                'created_by' => $userId,
            ]);

            // Associate Resume file if provided
            if (!empty($validated['resume_id'])) {
                $resume = Resume::find($validated['resume_id']);
                if ($resume) {
                    $resume->update(['candidate_id' => $candidate->id]);
                    if (empty($candidate->raw_extracted_text) && !empty($resume->text_content)) {
                        $candidate->update(['raw_extracted_text' => $resume->text_content]);
                    }
                }
            }

            // Save skills
            if (!empty($validated['skills'])) {
                foreach ($validated['skills'] as $skill) {
                    $name = is_array($skill) ? ($skill['skill_name'] ?? '') : $skill;
                    if ($name = trim($name)) {
                        CandidateSkill::create([
                            'candidate_id' => $candidate->id,
                            'skill_name' => $name,
                            'normalized_skill_name' => strtolower($name),
                            'category' => is_array($skill) ? ($skill['category'] ?? 'technical') : 'technical',
                            'years_of_experience' => is_array($skill) ? ($skill['years_of_experience'] ?? null) : null,
                            'proficiency' => is_array($skill) ? ($skill['proficiency'] ?? 'intermediate') : 'intermediate',
                        ]);
                    }
                }
            }

            // Save education
            if (!empty($validated['education'])) {
                foreach ($validated['education'] as $edu) {
                    if (!empty($edu['degree'])) {
                        CandidateEducation::create([
                            'candidate_id' => $candidate->id,
                            'degree' => $edu['degree'],
                            'specialization' => $edu['specialization'] ?? null,
                            'institution' => $edu['institution'] ?? null,
                            'graduation_year' => $edu['graduation_year'] ?? null,
                            'grade_or_gpa' => $edu['grade_or_gpa'] ?? null,
                        ]);
                    }
                }
            }

            // Save employment history
            if (!empty($validated['employment_history'])) {
                foreach ($validated['employment_history'] as $emp) {
                    if (!empty($emp['company_name'])) {
                        CandidateEmploymentHistory::create([
                            'candidate_id' => $candidate->id,
                            'company_name' => $emp['company_name'],
                            'job_title' => $emp['job_title'] ?? 'Software Engineer',
                            'start_date' => $emp['start_date'] ?? null,
                            'end_date' => $emp['end_date'] ?? null,
                            'is_current' => !empty($emp['is_current']),
                            'responsibilities' => $emp['responsibilities'] ?? null,
                            'location' => $emp['location'] ?? null,
                        ]);
                    }
                }
            }

            // Save certifications
            if (!empty($validated['certifications'])) {
                foreach ($validated['certifications'] as $cert) {
                    $certName = is_array($cert) ? ($cert['certification_name'] ?? '') : $cert;
                    if ($certName = trim($certName)) {
                        CandidateCertification::create([
                            'candidate_id' => $candidate->id,
                            'certification_name' => $certName,
                            'issuing_organization' => is_array($cert) ? ($cert['issuing_organization'] ?? null) : null,
                            'issue_year' => is_array($cert) ? ($cert['issue_year'] ?? null) : null,
                        ]);
                    }
                }
            }

            // Save languages
            if (!empty($validated['languages'])) {
                foreach ($validated['languages'] as $lang) {
                    $langName = is_array($lang) ? ($lang['language_name'] ?? '') : $lang;
                    if ($langName = trim($langName)) {
                        CandidateLanguage::create([
                            'candidate_id' => $candidate->id,
                            'language_name' => $langName,
                            'proficiency' => is_array($lang) ? ($lang['proficiency'] ?? 'Fluent') : 'Fluent',
                        ]);
                    }
                }
            }

            CandidateActivityLog::log(
                $candidate->id,
                $userId,
                'candidate_created',
                "Candidate {$candidate->full_name} created and approved."
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Candidate record created and approved successfully.',
                'data' => $candidate->load(['skills', 'education', 'employmentHistory', 'certifications', 'languages', 'latestResume']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to save candidate: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show comprehensive candidate profile.
     */
    public function show(int $id): JsonResponse
    {
        $candidate = Candidate::with([
            'skills',
            'education',
            'employmentHistory',
            'certifications',
            'languages',
            'resumes',
            'latestResume',
            'assignedRecruiter:id,name,email,role',
            'notes.user:id,name',
            'activityLogs.user:id,name',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $candidate,
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    }

    /**
     * Update an existing candidate profile.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);

        $validated = $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'alternate_phone' => 'nullable|string|max:30',
            'current_location' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'linkedin_url' => 'nullable|string|max:255',
            'portfolio_url' => 'nullable|string|max:255',
            'github_url' => 'nullable|string|max:255',
            'current_title' => 'nullable|string|max:150',
            'primary_role' => 'nullable|string|max:150',
            'total_experience_years' => 'nullable|numeric|min:0|max:50',
            'relevant_experience_years' => 'nullable|numeric|min:0|max:50',
            'current_company' => 'nullable|string|max:200',
            'highest_qualification' => 'nullable|string|max:150',
            'degree' => 'nullable|string|max:150',
            'specialization' => 'nullable|string|max:150',
            'current_salary' => 'nullable|numeric|min:0',
            'expected_salary' => 'nullable|numeric|min:0',
            'notice_period_days' => 'nullable|integer|min:0|max:365',
            'notice_period_text' => 'nullable|string|max:100',
            'availability_date' => 'nullable|date',
            'candidate_status' => 'sometimes|string|in:new,screening,shortlisted,interviewing,offered,hired,rejected,archived',
            'assigned_recruiter_id' => 'nullable|exists:users,id',
            'is_verified' => 'nullable|boolean',
            'resume_id' => 'nullable|exists:resumes,id',
            'skills' => 'nullable|array',
            'education' => 'nullable|array',
            'employment_history' => 'nullable|array',
            'certifications' => 'nullable|array',
            'languages' => 'nullable|array',
        ]);

        $oldValues = $candidate->only(['full_name', 'email', 'candidate_status', 'primary_role']);

        DB::beginTransaction();
        try {
            $candidate->update($validated);

            // Associate resume if provided
            if (!empty($validated['resume_id'])) {
                $resume = Resume::find($validated['resume_id']);
                if ($resume) {
                    $resume->update(['candidate_id' => $candidate->id]);
                    if (empty($candidate->raw_extracted_text) && !empty($resume->text_content)) {
                        $candidate->update(['raw_extracted_text' => $resume->text_content]);
                    }
                }
            }

            // Sync skills if provided
            if ($request->has('skills')) {
                CandidateSkill::where('candidate_id', $candidate->id)->delete();
                foreach ($validated['skills'] ?? [] as $skill) {
                    $name = is_array($skill) ? ($skill['skill_name'] ?? '') : $skill;
                    if ($name = trim($name)) {
                        CandidateSkill::create([
                            'candidate_id' => $candidate->id,
                            'skill_name' => $name,
                            'normalized_skill_name' => strtolower($name),
                            'category' => is_array($skill) ? ($skill['category'] ?? 'technical') : 'technical',
                            'years_of_experience' => is_array($skill) ? ($skill['years_of_experience'] ?? null) : null,
                            'proficiency' => is_array($skill) ? ($skill['proficiency'] ?? 'intermediate') : 'intermediate',
                        ]);
                    }
                }
            }

            // Sync education if provided
            if ($request->has('education')) {
                CandidateEducation::where('candidate_id', $candidate->id)->delete();
                foreach ($validated['education'] ?? [] as $edu) {
                    if (!empty($edu['degree'])) {
                        CandidateEducation::create([
                            'candidate_id' => $candidate->id,
                            'degree' => $edu['degree'],
                            'specialization' => $edu['specialization'] ?? null,
                            'institution' => $edu['institution'] ?? null,
                            'graduation_year' => $edu['graduation_year'] ?? null,
                            'grade_or_gpa' => $edu['grade_or_gpa'] ?? null,
                        ]);
                    }
                }
            }

            // Sync employment history if provided
            if ($request->has('employment_history')) {
                CandidateEmploymentHistory::where('candidate_id', $candidate->id)->delete();
                foreach ($validated['employment_history'] ?? [] as $emp) {
                    if (!empty($emp['company_name'])) {
                        CandidateEmploymentHistory::create([
                            'candidate_id' => $candidate->id,
                            'company_name' => $emp['company_name'],
                            'job_title' => $emp['job_title'] ?? 'Software Engineer',
                            'start_date' => $emp['start_date'] ?? null,
                            'end_date' => $emp['end_date'] ?? null,
                            'is_current' => !empty($emp['is_current']),
                            'responsibilities' => $emp['responsibilities'] ?? null,
                            'location' => $emp['location'] ?? null,
                        ]);
                    }
                }
            }

            // Sync certifications if provided
            if ($request->has('certifications')) {
                CandidateCertification::where('candidate_id', $candidate->id)->delete();
                foreach ($validated['certifications'] ?? [] as $cert) {
                    $certName = is_array($cert) ? ($cert['certification_name'] ?? '') : $cert;
                    if ($certName = trim($certName)) {
                        CandidateCertification::create([
                            'candidate_id' => $candidate->id,
                            'certification_name' => $certName,
                            'issuing_organization' => is_array($cert) ? ($cert['issuing_organization'] ?? null) : null,
                            'issue_year' => is_array($cert) ? ($cert['issue_year'] ?? null) : null,
                        ]);
                    }
                }
            }

            // Sync languages if provided
            if ($request->has('languages')) {
                CandidateLanguage::where('candidate_id', $candidate->id)->delete();
                foreach ($validated['languages'] ?? [] as $lang) {
                    $langName = is_array($lang) ? ($lang['language_name'] ?? '') : $lang;
                    if ($langName = trim($langName)) {
                        CandidateLanguage::create([
                            'candidate_id' => $candidate->id,
                            'language_name' => $langName,
                            'proficiency' => is_array($lang) ? ($lang['proficiency'] ?? 'Fluent') : 'Fluent',
                        ]);
                    }
                }
            }

            CandidateActivityLog::log(
                $candidate->id,
                $request->user()?->id,
                'candidate_updated',
                "Candidate {$candidate->full_name} profile updated.",
                $oldValues,
                $candidate->only(['full_name', 'email', 'candidate_status', 'primary_role'])
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Candidate updated successfully.',
                'data' => $candidate->fresh(['skills', 'education', 'employmentHistory', 'certifications', 'languages', 'latestResume']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update candidate: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soft delete candidate record.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);
        $name = $candidate->full_name;
        $candidate->delete();

        CandidateActivityLog::log(
            $id,
            $request->user()?->id,
            'candidate_deleted',
            "Candidate {$name} was moved to trash."
        );

        return response()->json([
            'success' => true,
            'message' => "Candidate {$name} deleted successfully.",
        ]);
    }

    /**
     * Bulk update candidate statuses.
     */
    public function bulkStatusUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'candidate_ids' => 'required|array|min:1',
            'candidate_ids.*' => 'exists:candidates,id',
            'status' => 'required|string|in:new,screening,shortlisted,interviewing,offered,hired,rejected,archived',
        ]);

        Candidate::whereIn('id', $validated['candidate_ids'])
            ->update(['candidate_status' => $validated['status']]);

        CandidateActivityLog::log(
            null,
            $request->user()?->id,
            'bulk_status_update',
            "Updated status to '{$validated['status']}' for " . count($validated['candidate_ids']) . " candidates."
        );

        return response()->json([
            'success' => true,
            'message' => 'Candidates status updated successfully.',
        ]);
    }

    /**
     * Duplicate detection endpoint.
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $email = trim($request->input('email', ''));
        $phone = trim($request->input('phone', ''));
        $fileHash = trim($request->input('file_hash', ''));

        $duplicateByEmail = null;
        if (!empty($email)) {
            $duplicateByEmail = Candidate::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
        }

        $duplicateByPhone = null;
        if (!empty($phone)) {
            $digits = preg_replace('/[^\d]/', '', $phone);
            $last10 = strlen($digits) >= 10 ? substr($digits, -10) : $digits;
            if (strlen($last10) >= 7) {
                $duplicateByPhone = Candidate::where('phone', 'like', "%{$last10}%")->first();
            } else {
                $duplicateByPhone = Candidate::where('phone', $phone)->first();
            }
        }

        $duplicateByHash = $fileHash ? Resume::with('candidate')->where('file_hash', $fileHash)->first() : null;

        $hasDuplicate = ($duplicateByEmail || $duplicateByPhone || $duplicateByHash);

        return response()->json([
            'success' => true,
            'has_duplicate' => (bool)$hasDuplicate,
            'duplicate_details' => [
                'by_email' => $duplicateByEmail,
                'by_phone' => $duplicateByPhone,
                'by_file' => $duplicateByHash?->candidate,
            ],
        ]);
    }

    /**
     * Export candidates to CSV respecting filters and permissions.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $query = Candidate::query()->with(['skills', 'latestResume', 'assignedRecruiter']);
        $this->applyFilters($query, $request);

        $candidates = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="candidates_export_' . date('Y-m-d_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        CandidateActivityLog::log(
            null,
            $request->user()?->id,
            'csv_exported',
            "Exported {$candidates->count()} candidate records to CSV."
        );

        return response()->stream(function () use ($candidates) {
            $handle = fopen('php://output', 'w');
            // Header row
            fputcsv($handle, [
                'ID', 'Full Name', 'Email', 'Phone', 'Primary Role', 'Current Title',
                'Experience (Years)', 'Location', 'City', 'Current Company',
                'Highest Qualification', 'Current Salary', 'Expected Salary',
                'Notice Period (Days)', 'Status', 'Key Skills', 'Resume Attached',
                'Assigned Recruiter', 'Created At'
            ]);

            foreach ($candidates as $c) {
                $skillsList = $c->skills->pluck('skill_name')->implode(', ');
                fputcsv($handle, [
                    $c->id,
                    $c->full_name,
                    $c->email,
                    $c->phone,
                    $c->primary_role,
                    $c->current_title,
                    $c->total_experience_years,
                    $c->current_location,
                    $c->city,
                    $c->current_company,
                    $c->highest_qualification,
                    $c->current_salary ? number_format($c->current_salary, 2) : '',
                    $c->expected_salary ? number_format($c->expected_salary, 2) : '',
                    $c->notice_period_days ?? '',
                    ucfirst($c->candidate_status),
                    $skillsList,
                    $c->latestResume ? 'Yes' : 'No',
                    $c->assignedRecruiter?->name ?? 'Unassigned',
                    $c->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
