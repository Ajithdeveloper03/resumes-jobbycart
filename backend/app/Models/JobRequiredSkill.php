<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobRequiredSkill extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_opening_id',
        'skill_name',
        'is_mandatory',
    ];

    protected function casts(): array
    {
        return [
            'is_mandatory' => 'boolean',
        ];
    }

    public function jobOpening(): BelongsTo
    {
        return $this->belongsTo(JobOpening::class);
    }
}
