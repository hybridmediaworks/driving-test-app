<?php

namespace App\Actions\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;

class StartOrResumeQuizAttempt
{
    /**
     * Freshness window for treating an in-progress attempt as resumable. Older ones are simply
     * ignored (the caller starts fresh instead) rather than cleaned up — same as the `in_progress`
     * stat bucket already tolerating open-ended rows today. Public so QuizController can apply the
     * same cutoff when deciding whether to expose a quiz's `in_progress` summary.
     */
    public const RESUMABLE_WITHIN_DAYS = 7;

    /**
     * Returns the caller's existing in-progress attempt for this quiz if one is still resumable,
     * otherwise starts a new one with a freshly shuffled, persisted question order.
     */
    public function __invoke(Quiz $quiz, ?int $userId, ?string $guestToken, bool $forceNew = false): QuizAttempt
    {
        if (! $forceNew) {
            $existing = $this->findResumable($quiz, $userId, $guestToken);
            if ($existing !== null) {
                return $existing->load('answers.question.answers');
            }
        }

        $questionIds = $quiz->quizQuestions()->pluck('id')->shuffle()->values()->all();

        return QuizAttempt::query()->create([
            'user_id' => $userId,
            'guest_token' => $userId === null ? $guestToken : null,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::InProgress,
            'total_questions' => count($questionIds),
            'question_order' => $questionIds,
            'started_at' => now(),
        ]);
    }

    /**
     * The caller's own in-progress attempt with this id on this quiz, or null if it doesn't exist,
     * belongs to someone else, or isn't in progress anymore. Shared by GradeQuizAttempt (closing
     * out a resumed attempt on submit) and QuizController::checkAnswer (persisting an answer
     * mid-attempt).
     */
    public function findOwned(int $attemptId, Quiz $quiz, ?int $userId, ?string $guestToken): ?QuizAttempt
    {
        return QuizAttempt::query()
            ->where('id', $attemptId)
            ->where('quiz_id', $quiz->id)
            ->where('status', AttemptStatus::InProgress)
            ->when(
                $userId !== null,
                fn ($q) => $q->where('user_id', $userId),
                fn ($q) => $q->where('guest_token', $guestToken),
            )
            ->first();
    }

    private function findResumable(Quiz $quiz, ?int $userId, ?string $guestToken): ?QuizAttempt
    {
        if ($userId === null && $guestToken === null) {
            return null;
        }

        return QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('status', AttemptStatus::InProgress)
            ->where('updated_at', '>=', now()->subDays(self::RESUMABLE_WITHIN_DAYS))
            ->when(
                $userId !== null,
                fn ($q) => $q->where('user_id', $userId),
                fn ($q) => $q->where('guest_token', $guestToken),
            )
            // `id` as a tiebreaker — two attempts can share the same `updated_at` (e.g. force_new
            // immediately followed by another start within the same second/tick), and the most
            // recently *created* one should always win a tie, not whichever row the DB happens to
            // return first.
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
    }
}
