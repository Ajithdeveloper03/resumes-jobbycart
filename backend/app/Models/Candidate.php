<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Candidate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'full_name',
        'email',
        'phone',
        'alternate_phone',
        'current_location',
        'city',
        'state',
        'country',
        'linkedin_url',
        'portfolio_url',
        'github_url',
        'current_title',
        'primary_role',
        'total_experience_years',
        'relevant_experience_years',
        'current_company',
        'highest_qualification',
        'degree',
        'specialization',
        'current_salary',
        'expected_salary',
        'notice_period_days',
        'notice_period_text',
        'availability_date',
        'candidate_status',
        'source',
        'assigned_recruiter_id',
        'professional_summary',
        'extraction_status',
        'is_verified',
        'raw_extracted_text',
        'fields_for_review',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'total_experience_years' => 'float',
            'relevant_experience_years' => 'float',
            'current_salary' => 'float',
            'expected_salary' => 'float',
            'notice_period_days' => 'integer',
            'is_verified' => 'boolean',
            'availability_date' => 'date',
            'fields_for_review' => 'array',
        ];
    }

    protected $hidden = [];

    public function resumes(): HasMany
    {
        return $this->hasMany(Resume::class);
    }

    public function latestResume(): HasOne
    {
        return $this->hasOne(Resume::class)->latest('id');
    }

    public function skills(): HasMany
    {
        return $this->hasMany(CandidateSkill::class);
    }

    public function education(): HasMany
    {
        return $this->hasMany(CandidateEducation::class);
    }

    public function employmentHistory(): HasMany
    {
        return $this->hasMany(CandidateEmploymentHistory::class)->orderBy('is_current', 'desc');
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(CandidateCertification::class);
    }

    public function languages(): HasMany
    {
        return $this->hasMany(CandidateLanguage::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(CandidateApplication::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CandidateNote::class)->latest();
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(CandidateActivityLog::class)->latest();
    }

    public function assignedRecruiter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_recruiter_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
