<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuizTranslationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, question: QuizQuestion, correct: QuizAnswer, wrong: QuizAnswer}
     */
    private function makeQuestion(): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create([
            'question_text' => 'What does a yellow diamond sign mean?',
            'explanation' => 'It warns of a hazard ahead.',
        ]);
        $correct = QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['answer_text' => 'Warning']);
        $wrong = QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'Stop']);

        return compact('quiz', 'question', 'correct', 'wrong');
    }

    private function fakeGrokTranslation(callable $buildContent): void
    {
        config([
            'services.grok.key' => 'test-key',
            'services.grok.model' => 'llama-3.3-70b-versatile',
            'services.grok.base_url' => 'https://api.groq.com/openai/v1',
        ]);
        Http::fake([
            'api.groq.com/*' => Http::response(
                ['choices' => [['message' => ['content' => json_encode($buildContent())]]]],
            ),
        ]);
    }

    public function test_show_serves_english_by_default(): void
    {
        ['quiz' => $quiz] = $this->makeQuestion();

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $response->assertJsonPath('content_language', 'en');
        $response->assertJsonPath('questions.0.question_text', 'What does a yellow diamond sign mean?');
    }

    public function test_show_translates_and_caches_on_first_request(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuestion();
        $this->fakeGrokTranslation(fn () => [
            'questions' => [
                [
                    'id' => $question->id,
                    'question_text' => '¿Qué significa una señal de diamante amarillo?',
                    'explanation' => 'Advierte de un peligro adelante.',
                    'answers' => [
                        ['id' => $correct->id, 'answer_text' => 'Advertencia'],
                        ['id' => $wrong->id, 'answer_text' => 'Alto'],
                    ],
                ],
            ],
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es");

        $response->assertOk();
        $response->assertJsonPath('content_language', 'es');
        $response->assertJsonPath('questions.0.question_text', '¿Qué significa una señal de diamante amarillo?');
        $answers = collect($response->json('questions.0.answers'))->keyBy('id');
        $this->assertEquals('Advertencia', $answers[$correct->id]['answer_text']);
        $this->assertEquals('Alto', $answers[$wrong->id]['answer_text']);

        $this->assertDatabaseHas('translations', [
            'translatable_type' => QuizQuestion::class,
            'translatable_id' => $question->id,
            'locale' => 'es',
        ]);
        Http::assertSentCount(1);
    }

    public function test_second_request_uses_the_cache_and_does_not_call_the_llm_again(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuestion();
        $this->fakeGrokTranslation(fn () => [
            'questions' => [[
                'id' => $question->id,
                'question_text' => 'Translated once',
                'explanation' => null,
                'answers' => [
                    ['id' => $correct->id, 'answer_text' => 'A'],
                    ['id' => $wrong->id, 'answer_text' => 'B'],
                ],
            ]],
        ]);

        $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es")->assertOk();
        $second = $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es");

        $second->assertOk();
        $second->assertJsonPath('content_language', 'es');
        $second->assertJsonPath('questions.0.question_text', 'Translated once');
        Http::assertSentCount(1); // only the first request should have hit the LLM
    }

    public function test_falls_back_to_english_when_translation_is_not_configured(): void
    {
        ['quiz' => $quiz] = $this->makeQuestion();
        config(['services.grok.key' => null]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es");

        $response->assertOk();
        $response->assertJsonPath('content_language', 'en');
        $response->assertJsonPath('questions.0.question_text', 'What does a yellow diamond sign mean?');
    }

    public function test_falls_back_to_english_when_the_llm_response_is_malformed(): void
    {
        ['quiz' => $quiz] = $this->makeQuestion();
        config([
            'services.grok.key' => 'test-key',
            'services.grok.model' => 'llama-3.3-70b-versatile',
            'services.grok.base_url' => 'https://api.groq.com/openai/v1',
        ]);
        Http::fake([
            'api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => 'not valid json']]]]),
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es");

        $response->assertOk();
        $response->assertJsonPath('content_language', 'en');
        $response->assertJsonPath('questions.0.question_text', 'What does a yellow diamond sign mean?');
        $this->assertDatabaseCount('translations', 0);
    }

    public function test_unsupported_locale_falls_back_to_english(): void
    {
        ['quiz' => $quiz] = $this->makeQuestion();

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}?language=fr");

        $response->assertOk();
        $response->assertJsonPath('content_language', 'en');
    }

    public function test_check_answer_returns_translated_explanation_when_already_cached(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuestion();
        $this->fakeGrokTranslation(fn () => [
            'questions' => [[
                'id' => $question->id,
                'question_text' => 'Translated question',
                'explanation' => 'Explicación traducida.',
                'answers' => [
                    ['id' => $correct->id, 'answer_text' => 'A'],
                    ['id' => $wrong->id, 'answer_text' => 'B'],
                ],
            ]],
        ]);
        // Warm the cache the same way the frontend would: view the quiz in Spanish first.
        $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es")->assertOk();

        $response = $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check?language=es",
            ['answer_id' => $correct->id],
        );

        $response->assertOk();
        $response->assertJsonPath('explanation', 'Explicación traducida.');
    }

    public function test_check_answer_falls_back_to_english_when_not_yet_cached(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct] = $this->makeQuestion();

        // No prior `show` call in Spanish, so nothing is cached — checkAnswer must not itself
        // trigger a translation (and indeed makes no LLM call at all here).
        $response = $this->postJson(
            "/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/check?language=es",
            ['answer_id' => $correct->id],
        );

        $response->assertOk();
        $response->assertJsonPath('explanation', 'It warns of a hazard ahead.');
    }

    public function test_translated_response_still_includes_assets_and_media(): void
    {
        ['quiz' => $quiz, 'question' => $question, 'correct' => $correct, 'wrong' => $wrong] = $this->makeQuestion();
        QuizQuestionAsset::factory()->for($question, 'quizQuestion')->create([
            'type' => 'video',
            'external_url' => 'https://example.com/hazard-1.mp4',
        ]);
        $this->fakeGrokTranslation(fn () => [
            'questions' => [[
                'id' => $question->id,
                'question_text' => 'Translated',
                'explanation' => null,
                'answers' => [
                    ['id' => $correct->id, 'answer_text' => 'A'],
                    ['id' => $wrong->id, 'answer_text' => 'B'],
                ],
            ]],
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es");

        $response->assertOk();
        // Regression guard: a second load() call for translations must not silently drop
        // sibling relations (assets/media) loaded by the first load() call.
        $response->assertJsonPath('questions.0.assets.0.type', 'video');
        $response->assertJsonPath('questions.0.assets.0.url', 'https://example.com/hazard-1.mp4');
        $response->assertJsonPath('questions.0.image_urls', []);
    }

    public function test_ids_the_model_did_not_send_are_ignored_rather_than_trusted(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $otherQuestion = QuizQuestion::factory()->create();
        $this->fakeGrokTranslation(fn () => [
            'questions' => [[
                'id' => $otherQuestion->id, // not part of this batch — must be ignored
                'question_text' => 'Should be ignored',
                'explanation' => null,
                'answers' => [],
            ]],
        ]);

        $this->getJson("/api/v1/quizzes/{$quiz->id}?language=es")->assertOk();

        $this->assertDatabaseMissing('translations', [
            'translatable_type' => QuizQuestion::class,
            'translatable_id' => $otherQuestion->id,
        ]);
        $this->assertDatabaseMissing('translations', [
            'translatable_type' => QuizQuestion::class,
            'translatable_id' => $question->id,
        ]);
    }
}
