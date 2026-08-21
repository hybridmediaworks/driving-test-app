<?php

namespace App\Models;

use App\Enums\ImageRegenerationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class QuizImageRegeneration extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_url',
        'representative_media_id',
        'usage_count',
        'question_context',
        'status',
        'prompt',
        'candidate_disk',
        'candidate_path',
        'backup_path',
        'attempts',
        'error',
        'admin_user_id',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ImageRegenerationStatus::class,
            'decided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    /**
     * The representative Spatie media row for this unique image (used to resolve the live file path
     * and public URL). Not an Eloquent relation because `media` is Spatie-managed.
     */
    public function media(): ?Media
    {
        return $this->representative_media_id
            ? Media::query()->find($this->representative_media_id)
            : null;
    }
}
