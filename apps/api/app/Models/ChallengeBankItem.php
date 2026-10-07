<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChallengeBankItem extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
        'quiz_question_id',
        'missed',
        'bookmarked',
    ];

    protected function casts(): array
    {
        return [
            'missed' => 'boolean',
            'bookmarked' => 'boolean',
        ];
    }

    /**
     * Set one of the two reasons a question sits in the vault, for every id given.
     *
     * The pair are independent: the grader owns `missed`, the learner's bookmark owns `bookmarked`,
     * and a row stands while either is true. insertOrIgnore cannot raise the flag on a row that is
     * already there, so an insert for the new ones is followed by an update for the rest.
     *
     * @param  array{user_id: int}|array{guest_token: string}  $owner
     * @param  list<int>  $questionIds
     */
    public static function mark(array $owner, array $questionIds, string $flag): void
    {
        if ($questionIds === []) {
            return;
        }

        $now = now();
        static::query()->insertOrIgnore(array_map(fn (int $id) => [
            ...$owner,
            'quiz_question_id' => $id,
            'missed' => $flag === 'missed',
            'bookmarked' => $flag === 'bookmarked',
            'created_at' => $now,
            'updated_at' => $now,
        ], $questionIds));

        static::query()
            ->where($owner)
            ->whereIn('quiz_question_id', $questionIds)
            ->update([$flag => true, 'updated_at' => $now]);
    }

    /**
     * Clear one reason, and drop the row once neither reason is left — so answering a question right
     * no longer throws away a bookmark, and un-bookmarking no longer forgets that it was missed.
     *
     * @param  array{user_id: int}|array{guest_token: string}  $owner
     * @param  list<int>  $questionIds
     */
    public static function clear(array $owner, array $questionIds, string $flag): void
    {
        if ($questionIds === []) {
            return;
        }

        static::query()
            ->where($owner)
            ->whereIn('quiz_question_id', $questionIds)
            ->update([$flag => false, 'updated_at' => now()]);

        static::query()
            ->where($owner)
            ->whereIn('quiz_question_id', $questionIds)
            ->where('missed', false)
            ->where('bookmarked', false)
            ->delete();
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
