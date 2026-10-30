<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resume extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'original_filename',
        'stored_filename',
        'file_path',
        'file_mime',
        'file_size',
        'file_hash',
        'parsing_status',
        'parsing_error',
        'text_content',
        'extracted_json',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'extracted_json' => 'array',
        ];
    }

    protected $hidden = [];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
