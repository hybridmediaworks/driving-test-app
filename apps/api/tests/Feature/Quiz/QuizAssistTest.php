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

    public function test_ask_mode_unlocks_the_full_explanation_once_answered(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok('That option is correct because a wet road reduces traction.');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'why is that the answer?',
            'answered' => true,
        ])->assertOk();

        // Once the learner has answered, the reveal is unlocked: the no-reveal guardrail must be gone
        // and the model explicitly permitted to name the correct option.
        Http::assertSent(function ($request) {
            $system = $request->data()['messages'][0]['content'] ?? '';

            return ! str_contains($system, 'never reveal the answer')
                && str_contains($system, 'already answered');
        });
    }

    public function test_hint_mode_never_reveals_even_after_answering(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok('Think about how much room a motorcycle needs.');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'hint',
            'answered' => true,
        ])->assertOk();

        // Hint mode is always a nudge — even after answering it must keep the no-reveal guardrail.
        Http::assertSent(function ($request) {
            $system = $request->data()['messages'][0]['content'] ?? '';

            return str_contains($system, 'never reveal the answer');
        });
    }

    public function test_wrong_pick_is_surfaced_to_the_tutor_when_answered(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['answer_text' => 'Slow down']);
        $wrong = QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'Speed up']);
        $this->fakeGrok('You picked "Speed up", but on a wet road that reduces control.');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'Why is my answer wrong?',
            'answered' => true,
            'selected_answer_id' => $wrong->id,
        ])->assertOk();

        // The learner's wrong pick must reach the model so it can address that specific choice.
        Http::assertSent(function ($request) {
            $user = $request->data()['messages'][1]['content'] ?? '';

            return str_contains($user, "LEARNER'S CHOSEN ANSWER (incorrect)")
                && str_contains($user, 'Speed up');
        });
    }

    public function test_wrong_pick_is_not_surfaced_before_answering(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
        $wrong = QuizAnswer::factory()->for($question, 'quizQuestion')->create();
        $this->fakeGrok('Think about traction on a wet road.');

        // answered omitted (false): even with a selected id, nothing about the pick should leak.
        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'Why is my answer wrong?',
            'selected_answer_id' => $wrong->id,
        ])->assertOk();

        Http::assertSent(function ($request) {
            $user = $request->data()['messages'][1]['content'] ?? '';

            return ! str_contains($user, "LEARNER'S CHOSEN ANSWER");
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
