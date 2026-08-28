<?php

namespace App\Actions\Quiz;

use App\Enums\AttemptStatus;
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

            foreach ($submittedAnswers as $row) {
                $question = $questions->get($row['question_id']);
                if ($question === null) {
                    continue;
                }

                $graded = ($this->gradeSingleAnswer)($question, $row['answer_id'] ?? null);

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
                'passed' => $quiz->passing_score_percent !== null ? $score >= $quiz->passing_score_percent : null,
                'completed_at' => now(),
                'duration_seconds' => $durationSeconds,
            ]);

            return $attempt->load(['answers.question.answers', 'answers.answer']);
        });
    }
}
