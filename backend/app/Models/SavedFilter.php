<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedFilter extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'filter_criteria',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'filter_criteria' => 'array',
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
