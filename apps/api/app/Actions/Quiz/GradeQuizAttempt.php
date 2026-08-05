<?php

namespace App\Actions\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\DB;

class GradeQuizAttempt
{
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

            foreach ($submittedAnswers as $row) {
                $question = $questions->get($row['question_id']);
                if ($question === null) {
                    continue;
                }

                $answerId = $row['answer_id'] ?? null;
                $answer = $answerId !== null ? $question->answers->firstWhere('id', $answerId) : null;
                $isCorrect = $answer !== null && $answer->is_correct;

                if ($isCorrect) {
                    $correctCount++;
                }

                $attempt->answers()->create([
                    'quiz_question_id' => $question->id,
                    'quiz_answer_id' => $answer?->id,
                    'is_correct' => $isCorrect,
                    'answered_at' => now(),
                ]);
            }

            $score = $questions->isNotEmpty() ? (int) round($correctCount / $questions->count() * 100) : 0;

            $attempt->update([
                'correct_count' => $correctCount,
                'score' => $score,
                'passed' => $quiz->passing_score_percent !== null ? $score >= $quiz->passing_score_percent : null,
            ]);

            return $attempt->load(['answers.question.answers', 'answers.answer']);
        });
    }
}
