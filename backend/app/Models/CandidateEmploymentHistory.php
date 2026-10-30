<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateEmploymentHistory extends Model
{
    use HasFactory;

    protected $table = 'candidate_employment_history';

    protected $fillable = [
        'candidate_id',
        'company_name',
        'job_title',
        'start_date',
        'end_date',
        'is_current',
        'responsibilities',
        'location',
    ];

    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }
}
