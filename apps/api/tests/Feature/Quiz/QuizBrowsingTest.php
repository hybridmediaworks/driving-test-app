<?php

namespace Tests\Feature\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

    public function test_index_exposes_the_first_question_image_as_the_preview_image(): void
    {
        Storage::fake('public');

        $quiz = Quiz::factory()->create(['is_active' => true]);
        // An earlier question with no image, then a later one that has an image — the preview must
        // skip the imageless first question and use the image from the one that actually has one.
        QuizQuestion::factory()->for($quiz, 'quiz')->create(['sort_order' => 1]);
        $withImage = QuizQuestion::factory()->for($quiz, 'quiz')->create(['sort_order' => 2]);
        $withImage->addMedia(UploadedFile::fake()->image('scene.jpg', 800, 400))
            ->toMediaCollection(QuizQuestion::MEDIA_COLLECTION_IMAGES);

        $expectedUrl = $withImage->fresh()->image_urls[0];

        $response = $this->getJson('/api/v1/quizzes');

        $response->assertOk();
        $this->assertNotNull($expectedUrl);
        $response->assertJsonPath('data.0.preview_image_url', $expectedUrl);
    }

    public function test_index_preview_image_is_null_when_no_question_has_an_image(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        QuizQuestion::factory()->for($quiz, 'quiz')->create();

        $response = $this->getJson('/api/v1/quizzes');

        $response->assertOk();
        $response->assertJsonPath('data.0.preview_image_url', null);
    }

    public function test_index_flags_which_quizzes_the_authenticated_user_has_completed(): void
    {
        $user = User::factory()->create();
        $completed = Quiz::factory()->create(['is_active' => true, 'title' => 'Done Quiz']);
        $untouched = Quiz::factory()->create(['is_active' => true, 'title' => 'Fresh Quiz']);

        QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $completed->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes');

        $response->assertOk();
        $byTitle = collect($response->json('data'))->keyBy('title');
        $this->assertTrue($byTitle['Done Quiz']['attempted']);
        $this->assertFalse($byTitle['Fresh Quiz']['attempted']);
        $this->assertNull($byTitle['Fresh Quiz']['user_passed']);
    }

    public function test_index_reports_pass_or_fail_against_the_pass_line(): void
    {
        $user = User::factory()->create();
        // No pass mark set → falls back to the shared 80% line (same as the quiz player).
        $passed = Quiz::factory()->create(['is_active' => true, 'title' => 'Passed Quiz', 'passing_score_percent' => null]);
        $failed = Quiz::factory()->create(['is_active' => true, 'title' => 'Failed Quiz', 'passing_score_percent' => null]);

        // Two attempts on the "passed" quiz — the best (90) counts, so it reads as passed even though
        // an earlier attempt (40) was below the line.
        foreach ([40, 90] as $score) {
            QuizAttempt::query()->create([
                'user_id' => $user->id,
                'quiz_id' => $passed->id,
                'status' => AttemptStatus::Completed,
                'total_questions' => 10,
                'correct_count' => (int) ($score / 10),
                'score' => $score,
                'started_at' => now(),
                'completed_at' => now(),
            ]);
        }

        QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $failed->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 10,
            'correct_count' => 6,
            'score' => 60,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $byTitle = collect($this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes')->json('data'))->keyBy('title');
        $this->assertTrue($byTitle['Passed Quiz']['user_passed']);
        $this->assertFalse($byTitle['Failed Quiz']['user_passed']);
    }

    public function test_index_honours_a_quiz_specific_pass_mark(): void
    {
        $user = User::factory()->create();
        // A 50% pass mark makes a score of 60 a pass, where the default 80% line would fail it.
        $quiz = Quiz::factory()->create(['is_active' => true, 'passing_score_percent' => 50]);
        QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 10,
            'correct_count' => 6,
            'score' => 60,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes')
            ->assertOk()
            ->assertJsonPath('data.0.user_passed', true);
    }

    public function test_index_never_flags_attempts_from_other_users_or_guests(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $quiz = Quiz::factory()->create(['is_active' => true]);

        // An attempt by a DIFFERENT user must not count as this user's completion.
        QuizAttempt::query()->create([
            'user_id' => $other->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes')
            ->assertOk()
            ->assertJsonPath('data.0.attempted', false);

        // Guests always get attempted=false (no user to key off).
        $this->getJson('/api/v1/quizzes')
            ->assertOk()
            ->assertJsonPath('data.0.attempted', false);
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
