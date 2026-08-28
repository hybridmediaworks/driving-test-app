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
    ): QuizAttempt {
        return DB::transaction(function () use ($quiz, $submittedAnswers, $userId, $guestToken, $durationSeconds): QuizAttempt {
            $questions = $quiz->quizQuestions()->with('answers')->get()->keyBy('id');

            $attempt = QuizAttempt::query()->create([
                'user_id' => $userId,
                'guest_token' => $guestToken,
                'quiz_id' => $quiz->id,
                'status' => AttemptStatus::Completed,
                'total_questions' => $questions->count(),
                'started_at' => now(),
                'completed_at' => now(),
                'duration_seconds' => $durationSeconds,
            ]);

            $correctCount = 0;
            $wrongQuestionIds = [];
            $correctQuestionIds = [];

            foreach ($submittedAnswers as $row) {
                $question = $questions->get($row['question_id']);
                if ($question === null) {
                    continue;
                }

                $graded = ($this->gradeSingleAnswer)($question, $row['answer_id'] ?? null);

                if ($graded['is_correct']) {
                    $correctCount++;
                    $correctQuestionIds[] = $question->id;
                } else {
                    $wrongQuestionIds[] = $question->id;
                }

                $attempt->answers()->create([
                    'quiz_question_id' => $question->id,
                    'quiz_answer_id' => $graded['selected_answer_id'],
                    'is_correct' => $graded['is_correct'],
                    'answered_at' => now(),
                ]);
            }

            // Keep the learner's Challenge Bank in sync (signed-in users only): every question they
            // got wrong is filed for re-practice, and any they finally got right leaves the bank.
            if ($userId !== null) {
                if ($wrongQuestionIds !== []) {
                    $now = now();
                    ChallengeBankItem::query()->insertOrIgnore(array_map(fn ($qid) => [
                        'user_id' => $userId,
                        'quiz_question_id' => $qid,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ], $wrongQuestionIds));
                }

                if ($correctQuestionIds !== []) {
                    ChallengeBankItem::query()
                        ->where('user_id', $userId)
                        ->whereIn('quiz_question_id', $correctQuestionIds)
                        ->delete();
                }
            }

            $score = $questions->isNotEmpty() ? (int) round($correctCount / $questions->count() * 100) : 0;

            $attempt->update([
                'correct_count' => $correctCount,
                'score' => $score,
                // Fall back to the app-wide 80% pass line when a quiz has no explicit passing score
                // — same default the rest of the app already uses (QuizResource, StateController,
                // the mobile results screen: `passing_score_percent ?? 80`). Storing null here meant
                // real 80%+ passes never counted toward "passed" totals.
                'passed' => $score >= ($quiz->passing_score_percent ?? 80),
            ]);

            return $attempt->load(['answers.question.answers', 'answers.answer']);
        });
    }
}
