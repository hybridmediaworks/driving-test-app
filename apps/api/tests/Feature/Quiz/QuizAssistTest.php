<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuizAssistTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, question: QuizQuestion}
     */
    private function makeQuestion(): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->create();

        return compact('quiz', 'question');
    }

    private function fakeGrok(string $reply = 'Think about what a yellow diamond warns you about.'): void
    {
        config([
            'services.grok.key' => 'test-key',
            'services.grok.model' => 'llama-3.3-70b-versatile',
            'services.grok.base_url' => 'https://api.groq.com/openai/v1',
        ]);
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['role' => 'assistant', 'content' => $reply]]],
            ]),
        ]);
    }

    public function test_hint_mode_returns_a_reply(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok('Consider what the shape of the sign implies.');

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'hint',
        ]);

        $response->assertOk();
        $response->assertJsonPath('reply', 'Consider what the shape of the sign implies.');
    }

    public function test_ask_mode_requires_a_message(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['message']);
    }

    public function test_invalid_mode_is_rejected(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'explain',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['mode']);
    }

    public function test_returns_503_when_no_api_key_is_configured(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        config(['services.grok.key' => null]);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'hint',
        ]);

        $response->assertStatus(503);
    }

    public function test_ask_mode_prompt_forbids_revealing_the_answer(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok("I can't give you the answer, but think about what happens to traction on a wet road.");

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'what is the correct answer?',
        ])->assertOk();

        // The system prompt sent to the model must carry the no-reveal guardrail even in ask mode —
        // this is the exact path that previously answered "the correct answer is ...".
        Http::assertSent(function ($request) {
            $system = $request->data()['messages'][0]['content'] ?? '';

            return str_contains($system, 'never reveal the answer')
                && str_contains($system, "can't give the answer");
        });
    }

    public function test_question_not_belonging_to_the_quiz_is_rejected(): void
    {
        ['quiz' => $quiz] = $this->makeQuestion();
        $this->fakeGrok();
        $otherQuestion = QuizQuestion::factory()->create();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$otherQuestion->id}/assist", [
            'mode' => 'hint',
        ]);

        $response->assertNotFound();
    }
}
