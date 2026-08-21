<?php

namespace Tests\Feature\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAnswerCheckTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, question: QuizQuestion, correct: QuizAnswer, wrong: QuizAnswer}
     */
    private function makeQuestion(string $explanation = 'Because the sign says so.'): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create(['explanation' => $explanation]);
        $correct = QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
        $wrong = QuizAnswer::factory()->for($question, 'quizQuestion')->create();

        return compact('quiz', 'question', 'correct', 'wrong');
    }

    public function test_correct_answer_is_reported_with_explanation(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", [
            'answer_id' => $correct->id,
        ]);

        $response->assertOk();
        $response->assertExactJson([
            'question_id' => $question->id,
            'selected_answer_id' => $correct->id,
            'correct_answer_id' => $correct->id,
            'is_correct' => true,
            'explanation' => 'Because the sign says so.',
            'answer_popularity' => null,
        ]);
    }

    public function test_answer_popularity_reflects_completed_attempts(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuestion();

        // Three completed attempts: two picked the correct answer, one picked the wrong one.
        foreach ([$correct, $correct, $wrong] as $picked) {
            $attempt = QuizAttempt::query()->create([
                'quiz_id' => $quiz->id,
                'status' => AttemptStatus::Completed,
                'total_questions' => 1,
                'correct_count' => $picked->is_correct ? 1 : 0,
                'score' => $picked->is_correct ? 100 : 0,
                'passed' => $picked->is_correct,
                'started_at' => now(),
                'completed_at' => now(),
            ]);
            $attempt->answers()->create([
                'quiz_question_id' => $question->id,
                'quiz_answer_id' => $picked->id,
                'is_correct' => $picked->is_correct,
                'answered_at' => now(),
            ]);
        }

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", [
            'answer_id' => $correct->id,
        ]);

        $response->assertOk();
        $response->assertJson([
            'answer_popularity' => [
                ['answer_id' => $correct->id, 'percentage' => 67],
                ['answer_id' => $wrong->id, 'percentage' => 33],
            ],
        ]);
    }

    public function test_wrong_answer_still_reveals_the_correct_answer_id(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", [
            'answer_id' => $wrong->id,
        ]);

        $response->assertOk();
        $response->assertJsonPath('is_correct', false);
        $response->assertJsonPath('selected_answer_id', $wrong->id);
        $response->assertJsonPath('correct_answer_id', $correct->id);
    }

    public function test_answer_id_from_another_question_is_treated_as_incorrect(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makeQuestion();
        $otherCorrect = QuizAnswer::factory()
            ->for(QuizQuestion::factory()->for($quiz, 'quiz')->create(), 'quizQuestion')
            ->correct()->create();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", [
            'answer_id' => $otherCorrect->id,
        ]);

        $response->assertOk();
        $response->assertJsonPath('is_correct', false);
        $response->assertJsonPath('selected_answer_id', null);
        $response->assertJsonPath('correct_answer_id', $correct->id);
    }

    public function test_answer_id_is_required(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['answer_id']);
    }

    public function test_question_not_belonging_to_the_quiz_is_rejected(): void
    {
        ['quiz' => $quiz, 'correct' => $correct] = $this->makeQuestion();
        $otherQuestion = QuizQuestion::factory()->create();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$otherQuestion->id}/check", [
            'answer_id' => $correct->id,
        ]);

        $response->assertNotFound();
    }

    public function test_cannot_check_an_answer_for_an_inactive_quiz(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makeQuestion();
        $quiz->update(['is_active' => false]);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check", [
            'answer_id' => $correct->id,
        ]);

        $response->assertForbidden();
    }
}
