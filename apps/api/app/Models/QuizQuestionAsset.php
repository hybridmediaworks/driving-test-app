<?php

namespace App\Models;

use App\Enums\QuizQuestionAssetType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class QuizQuestionAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_question_id',
        'type',
        'external_url',
        'disk',
        'path',
        'duration_seconds',
        'sort_order',
    ];

    protected $appends = [
        'url',
    ];

    protected function casts(): array
    {
        return [
            'type' => QuizQuestionAssetType::class,
        ];
    }

    /**
     * @return BelongsTo<QuizQuestion, $this>
     */
    public function quizQuestion(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(function (): ?string {
            // Prefer a self-hosted copy when we have one, falling back to the original external URL
            // (kept on the row for provenance). Lottie is fetched cross-origin by the player, so it
            // can't be served from the raw /storage URL — it goes through the CORS-covered API route
            // instead (see QuizQuestionAssetController::content); other types serve straight off disk.
            if ($this->disk && $this->path) {
                return $this->type === QuizQuestionAssetType::Lottie
                    ? url("/api/v1/quiz-question-assets/{$this->id}/content")
                    : Storage::disk($this->disk)->url($this->path);
            }

            return $this->external_url;
        });
    }
}
