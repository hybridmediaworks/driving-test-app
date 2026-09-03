<?php

namespace App\Actions\Quiz;

use App\Enums\AttemptStatus;
use App\Models\ChallengeBankItem;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\DB;

class GradeQuizAttempt
{
    public function __construct(
        private readonly GradeSingleAnswer $gradeSingleAnswer,
        private readonly StartOrResumeQuizAttempt $startOrResumeQuizAttempt,
    ) {}

    /**
     * @param  list<array{question_id: int, answer_id: int|null}>  $submittedAnswers
     */
    public function __invoke(
        Quiz $quiz,
        array $submittedAnswers,
        ?int $userId,
        ?string $guestToken,
        ?int $durationSeconds,
        ?int $attemptId = null,
    ): QuizAttempt {
        return DB::transaction(function () use ($quiz, $submittedAnswers, $userId, $guestToken, $durationSeconds, $attemptId): QuizAttempt {
            $questions = $quiz->quizQuestions()->with('answers')->get()->keyBy('id');

            // Reuse the in-progress attempt started via StartOrResumeQuizAttempt when one is given
            // and it's actually the caller's own — this is what closes out a resumed attempt
            // instead of creating a duplicate row. Falls back to creating fresh (then immediately
            // completing, below) for callers that never called /attempts/start, e.g. the mobile
            // app, which isn't wired up to the resume flow yet.
            $attempt = ($attemptId !== null ? $this->startOrResumeQuizAttempt->findOwned($attemptId, $quiz, $userId, $guestToken) : null)
                ?? QuizAttempt::query()->create([
                    'user_id' => $userId,
                    'guest_token' => $userId === null ? $guestToken : null,
                    'quiz_id' => $quiz->id,
                    'status' => AttemptStatus::InProgress,
                    'total_questions' => $questions->count(),
                    'started_at' => now(),
                ]);

            $wrongQuestionIds = [];
            $correctQuestionIds = [];

            foreach ($submittedAnswers as $row) {
                $question = $questions->get($row['question_id']);
                if ($question === null) {
                    continue;
                }

                $graded = ($this->gradeSingleAnswer)($question, $row['answer_id'] ?? null);

                if ($graded['is_correct']) {
                    $correctQuestionIds[] = $question->id;
                } else {
                    $wrongQuestionIds[] = $question->id;
                }

                // Upsert rather than create — a resumed attempt may already have this question's
                // answer persisted from an earlier `checkAnswer` call; the final submit payload
                // wins on conflict.
                $attempt->answers()->updateOrCreate(
                    ['quiz_question_id' => $question->id],
                    [
                        'quiz_answer_id' => $graded['selected_answer_id'],
                        'is_correct' => $graded['is_correct'],
                        'answered_at' => now(),
                    ],
                );
            }

            // Keep the learner's Challenge Bank in sync — for signed-in users (scoped by user_id)
            // and signed-out guests alike (scoped by guest_token, later claimed into their account
            // on login): every question they got wrong is filed for re-practice, and any they
            // finally got right leaves the bank.
            $owner = $this->challengeBankOwner($userId, $guestToken);
            if ($owner !== null) {
                if ($wrongQuestionIds !== []) {
                    $now = now();
                    ChallengeBankItem::query()->insertOrIgnore(array_map(fn ($qid) => [
                        ...$owner,
                        'quiz_question_id' => $qid,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ], $wrongQuestionIds));
                }

                if ($correctQuestionIds !== []) {
                    ChallengeBankItem::query()
                        ->where($owner)
                        ->whereIn('quiz_question_id', $correctQuestionIds)
                        ->delete();
                }
            }

            // Counted from what's actually persisted (not just this call's payload) so a resumed
            // attempt's earlier `checkAnswer`-graded answers count too, even if the submit payload
            // didn't happen to repeat them all.
            $correctCount = $attempt->answers()->where('is_correct', true)->count();
            $totalQuestions = $attempt->total_questions ?: $questions->count();
            $score = $totalQuestions > 0 ? (int) round($correctCount / $totalQuestions * 100) : 0;

            $attempt->update([
                'status' => AttemptStatus::Completed,
                'correct_count' => $correctCount,
                'score' => $score,
                // Fall back to the app-wide 80% pass line when a quiz has no explicit passing score
                // — same default the rest of the app already uses (QuizResource, StateController,
                // the mobile results screen: `passing_score_percent ?? 80`). Storing null here meant
                // real 80%+ passes never counted toward "passed" totals.
                'passed' => $score >= ($quiz->passing_score_percent ?? 80),
                'completed_at' => now(),
                'duration_seconds' => $durationSeconds,
            ]);

            return $attempt->load(['answers.question.answers', 'answers.answer']);
        });
    }

    /**
     * The Challenge Bank ownership scope for this caller — keyed by user_id for a signed-in learner,
     * or guest_token for a guest. Doubles as the column/value pair to insert. Null when neither is
     * known, meaning nothing is filed.
     *
     * @return array{user_id: int}|array{guest_token: string}|null
     */
    private function challengeBankOwner(?int $userId, ?string $guestToken): ?array
    {
        if ($userId !== null) {
            return ['user_id' => $userId];
        }

        if ($guestToken !== null && $guestToken !== '') {
            return ['guest_token' => $guestToken];
        }

        return null;
    }
}
