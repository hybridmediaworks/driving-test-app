<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizSampleQuestionsTest extends TestCase
{
    use RefreshDatabase;

    private function makeQuizWithQuestions(int $count, bool $premium = false): Quiz
    {
        $quiz = Quiz::factory()->create(['is_active' => true, 'is_premium' => $premium]);

        for ($i = 0; $i < $count; $i++) {
            $question = QuizQuestion::factory()->for($quiz, 'quiz')->create([
                'sort_order' => $i,
                'explanation' => "Explanation {$i}",
            ]);
            QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
            QuizAnswer::factory()->for($question, 'quizQuestion')->create();
        }

        return $quiz;
    }

    public function test_it_returns_six_questions_with_the_answer_and_explanation_by_default(): void
    {
        $quiz = $this->makeQuizWithQuestions(9);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}/sample-questions");

        $response->assertOk();
        $this->assertCount(6, $response->json('data'));
        $this->assertSame('Explanation 0', $response->json('data.0.explanation'));
        $this->assertTrue($response->json('data.0.answers.0.is_correct'));
        $this->assertFalse($response->json('data.0.answers.1.is_correct'));
    }

    public function test_it_honours_the_limit_and_caps_it_at_ten(): void
    {
        $quiz = $this->makeQuizWithQuestions(12);

        $this->getJson("/api/v1/quizzes/{$quiz->id}/sample-questions?limit=3")
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->getJson("/api/v1/quizzes/{$quiz->id}/sample-questions?limit=50")
            ->assertOk()
            ->assertJsonCount(10, 'data');
    }

    public function test_it_reveals_nothing_for_a_premium_quiz_a_guest_is_not_entitled_to(): void
    {
        $quiz = $this->makeQuizWithQuestions(6, premium: true);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}/sample-questions");

        $response->assertOk();
        $response->assertExactJson(['data' => []]);
    }
}
