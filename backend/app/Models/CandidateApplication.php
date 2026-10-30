<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'job_opening_id',
        'match_score',
        'match_details',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'match_score' => 'float',
            'match_details' => 'array',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function jobOpening(): BelongsTo
    {
        return $this->belongsTo(JobOpening::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
