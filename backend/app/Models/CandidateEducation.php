<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateEducation extends Model
{
    use HasFactory;

    protected $table = 'candidate_education';

    protected $fillable = [
        'candidate_id',
        'degree',
        'specialization',
        'institution',
        'graduation_year',
        'grade_or_gpa',
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }
}
