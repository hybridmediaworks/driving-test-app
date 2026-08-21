<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizQuestionReportTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, question: QuizQuestion}
     */
    private function makeQuestion(): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();

        return compact('quiz', 'question');
    }

    public function test_guest_can_report_a_mistake(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/report", [
            'comment' => 'The word should be "yield", not "yeild".',
            'flagged' => ['question' => true, 'image' => false, 'answers' => []],
            'reporter_name' => 'Sam',
            'reporter_email' => 'sam@example.com',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quiz_question_reports', [
            'quiz_question_id' => $question->id,
            'user_id' => null,
            'reporter_name' => 'Sam',
            'reporter_email' => 'sam@example.com',
        ]);
    }

    public function test_authenticated_report_attaches_user(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/report", [
                'comment' => 'Answer B is also correct.',
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('quiz_question_reports', [
            'quiz_question_id' => $question->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_comment_is_required(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/report", [
            'reporter_name' => 'Sam',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['comment']);
    }

    public function test_invalid_email_is_rejected(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/report", [
            'comment' => 'Typo here.',
            'reporter_email' => 'not-an-email',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['reporter_email']);
    }

    public function test_question_not_belonging_to_the_quiz_is_rejected(): void
    {
        ['quiz' => $quiz] = $this->makeQuestion();
        $otherQuestion = QuizQuestion::factory()->create();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$otherQuestion->id}/report", [
            'comment' => 'Typo here.',
        ]);

        $response->assertNotFound();
    }
}
