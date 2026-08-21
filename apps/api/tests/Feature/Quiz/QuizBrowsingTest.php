<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class QuizBrowsingTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_only_returns_active_quizzes(): void
    {
        Quiz::factory()->create(['is_active' => true, 'title' => 'Active Quiz']);
        Quiz::factory()->create(['is_active' => false, 'title' => 'Inactive Quiz']);

        $response = $this->getJson('/api/v1/quizzes');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Active Quiz'));
        $this->assertFalse($titles->contains('Inactive Quiz'));
    }

    public function test_index_filters_by_state_vehicle_type_and_category(): void
    {
        $match = Quiz::factory()->create(['is_active' => true]);
        $match->state()->update(['code' => 'CA']);
        $match->vehicleType()->update(['name' => 'motorcycle']);
        $match->category()->update(['name' => 'road-signs']);

        Quiz::factory()->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/quizzes?state=CA&vehicle_type=motorcycle&category=road-signs');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$match->id], $ids->all());
    }

    public function test_index_filters_by_slug(): void
    {
        $match = Quiz::factory()->create(['is_active' => true, 'slug' => 'ca-permit-practice-test-1']);
        Quiz::factory()->create(['is_active' => true, 'slug' => 'ca-permit-practice-test-2']);

        $response = $this->getJson('/api/v1/quizzes?slug=ca-permit-practice-test-1');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$match->id], $ids->all());
    }

    public function test_index_filters_by_test_track(): void
    {
        $permitQuiz = Quiz::factory()->create(['is_active' => true, 'test_track' => 'permit_test']);
        Quiz::factory()->create(['is_active' => true, 'test_track' => 'driving_test']);

        $response = $this->getJson('/api/v1/quizzes?test_track=permit_test');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$permitQuiz->id], $ids->all());
    }

    public function test_show_returns_questions_but_never_leaks_correctness_or_explanation(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create(['explanation' => 'Secret explanation']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['explanation' => 'Correct because...']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->create();

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();

        foreach ($response->json('questions') as $returnedQuestion) {
            $this->assertArrayNotHasKey('explanation', $returnedQuestion);
            foreach ($returnedQuestion['answers'] as $answer) {
                $this->assertArrayNotHasKey('is_correct', $answer);
                $this->assertArrayNotHasKey('explanation', $answer);
                $this->assertArrayHasKey('answer_text', $answer);
            }
        }
    }

    public function test_show_includes_a_question_s_hazard_perception_assets(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        QuizQuestionAsset::factory()->for($question, 'quizQuestion')->create([
            'type' => 'video',
            'external_url' => 'https://example.com/hazard-1.mp4',
            'duration_seconds' => 12,
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertOk();
        $response->assertJsonPath('questions.0.assets.0.type', 'video');
        $response->assertJsonPath('questions.0.assets.0.url', 'https://example.com/hazard-1.mp4');
        $response->assertJsonPath('questions.0.assets.0.duration_seconds', 12);
    }

    public function test_self_hosted_lottie_asset_is_served_through_the_cors_covered_api_route(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('quiz-lottie/rs-animation-1.json', '{"v":"5.2.1"}');

        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        // A localized Lottie keeps its external_url for provenance but is now backed by a local file.
        $asset = QuizQuestionAsset::factory()->for($question, 'quizQuestion')->create([
            'type' => 'lottie',
            'external_url' => 'https://driving-tests.org/rs-animation-1.json',
            'disk' => 'public',
            'path' => 'quiz-lottie/rs-animation-1.json',
        ]);

        // The published URL prefers the local copy and routes it through the API (not raw external_url,
        // and not the CORS-less /storage URL) so the player's cross-origin fetch succeeds.
        $expectedUrl = url("/api/v1/quiz-question-assets/{$asset->id}/content");
        $this->getJson("/api/v1/quizzes/{$quiz->id}")
            ->assertOk()
            ->assertJsonPath('questions.0.assets.0.url', $expectedUrl);

        $content = $this->get("/api/v1/quiz-question-assets/{$asset->id}/content");
        $content->assertOk();
        $this->assertStringContainsString('application/json', (string) $content->headers->get('Content-Type'));
        $this->assertSame('{"v":"5.2.1"}', $content->streamedContent());
    }

    public function test_asset_content_route_404s_when_no_local_file_is_stored(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        $asset = QuizQuestionAsset::factory()->for($question, 'quizQuestion')->create([
            'type' => 'lottie',
            'external_url' => 'https://driving-tests.org/rs-animation-1.json',
            'disk' => null,
            'path' => null,
        ]);

        $this->get("/api/v1/quiz-question-assets/{$asset->id}/content")->assertNotFound();
    }

    public function test_show_blocks_inactive_quiz(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => false]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}");

        $response->assertForbidden();
    }
}
