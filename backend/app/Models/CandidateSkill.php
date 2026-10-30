<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateSkill extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'skill_name',
        'normalized_skill_name',
        'category',
        'years_of_experience',
        'proficiency',
    ];

    protected function casts(): array
    {
        return [
            'years_of_experience' => 'float',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }
}
