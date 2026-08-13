<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestionReport extends Model
{
    protected $fillable = [
        'quiz_question_id',
        'user_id',
        'flagged',
        'comment',
        'reporter_name',
        'reporter_email',
    ];

    protected function casts(): array
    {
        return [
            'flagged' => 'array',
        ];
    }

    /**
     * @return BelongsTo<QuizQuestion, $this>
     */
    public function question(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class, 'quiz_question_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
