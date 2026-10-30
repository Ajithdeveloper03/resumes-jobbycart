<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobOpening extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'department',
        'client_name',
        'location',
        'min_experience',
        'max_experience',
        'qualification',
        'employment_type',
        'min_salary',
        'max_salary',
        'vacancies',
        'description',
        'priority',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'min_experience' => 'float',
            'max_experience' => 'float',
            'min_salary' => 'float',
            'max_salary' => 'float',
            'vacancies' => 'integer',
        ];
    }

    public function requiredSkills(): HasMany
    {
        return $this->hasMany(JobRequiredSkill::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(CandidateApplication::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
