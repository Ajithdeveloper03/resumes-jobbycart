<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'certification_name',
        'issuing_organization',
        'issue_year',
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }
}
