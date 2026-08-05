<?php

namespace App\Models;

use App\Enums\AttemptStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
        'quiz_id',
        'status',
        'score',
        'passed',
        'correct_count',
        'total_questions',
        'started_at',
        'completed_at',
        'duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'status' => AttemptStatus::class,
            'passed' => 'boolean',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Quiz, $this>
     */
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * @return HasMany<QuizAttemptAnswer, $this>
     */
    public function answers(): HasMany
    {
        return $this->hasMany(QuizAttemptAnswer::class);
    }

    /**
     * Shared eager-load set for rendering an attempt list with full per-question review data —
     * used by both the self-service and admin attempt listings so they stay in sync.
     *
     * @param  Builder<QuizAttempt>  $query
     * @return Builder<QuizAttempt>
     */
    public function scopeWithReviewDetails(Builder $query): Builder
    {
        return $query->with(['quiz.category', 'quiz.quizType', 'answers.question.answers']);
    }
}
