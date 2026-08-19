<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuizResultsInsightTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGrok(array $json): void
    {
        config(['services.grok.key' => 'test-key', 'services.grok.model' => 'llama-3.3-70b-versatile', 'services.grok.base_url' => 'https://api.groq.com/openai/v1']);
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['role' => 'assistant', 'content' => json_encode($json)]]],
            ]),
        ]);
    }

    public function test_returns_ai_weak_areas_and_message(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $q = QuizQuestion::factory()->for($quiz, 'quiz')->create(['topic' => 'Road Signs']);

        // The model returns an em dash; the action must sanitize it to plain punctuation.
        $this->fakeGrok([
            'weak_areas' => ['Road Signs', 'Right of Way'],
            'message' => "Nice work — just brush up on signs and you're set!",
        ]);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/results-insight", [
            'correct' => 18,
            'total' => 20,
            'wrong_question_ids' => [$q->id],
        ]);

        $response->assertOk();
        $response->assertJson([
            'weak_areas' => ['Road Signs', 'Right of Way'],
            'message' => "Nice work, just brush up on signs and you're set!",
        ]);
        $this->assertStringNotContainsString('—', (string) $response->json('message'));
    }

    public function test_falls_back_to_topics_when_no_api_key(): void
    {
        config(['services.grok.key' => null]);
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $q = QuizQuestion::factory()->for($quiz, 'quiz')->create(['topic' => 'Parking']);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/results-insight", [
            'correct' => 10,
            'total' => 20,
            'wrong_question_ids' => [$q->id],
        ]);

        $response->assertOk();
        $response->assertJsonPath('weak_areas', ['Parking']);
        $this->assertIsString($response->json('message'));
    }

    public function test_requires_total(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/results-insight", ['correct' => 5]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['total']);
    }

    public function test_gated_on_inactive_quiz(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => false]);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/results-insight", [
            'correct' => 5,
            'total' => 10,
        ]);

        $response->assertForbidden();
    }
}
