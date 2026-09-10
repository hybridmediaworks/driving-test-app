<?php

namespace Tests\Feature\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers `GET /quizzes/{quiz}/attempts/latest` — the public, guest-aware "View results" lookup
 * that exists precisely because the account-only `GET /attempts` (see QuizAttemptHistoryTest)
 * can't resolve a guest's own results at all.
 */
class QuizAttemptLatestTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_with_no_attempts_gets_a_null_attempt(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}/attempts/latest", [
            'X-Guest-Token' => 'guest-abc',
        ]);

        $response->assertOk();
        $response->assertJson(['attempt' => null]);
    }

    public function test_guest_can_fetch_their_own_completed_attempt_by_guest_token(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $attempt = QuizAttempt::query()->create([
            'guest_token' => 'guest-abc',
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 4,
            'score' => 80,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}/attempts/latest", [
            'X-Guest-Token' => 'guest-abc',
        ]);

        $response->assertOk();
        $response->assertJsonPath('attempt.id', $attempt->id);
    }

    public function test_a_guests_in_progress_attempt_is_not_returned_as_a_result(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        QuizAttempt::query()->create([
            'guest_token' => 'guest-abc',
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::InProgress,
            'total_questions' => 5,
            'started_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}/attempts/latest", [
            'X-Guest-Token' => 'guest-abc',
        ]);

        $response->assertOk();
        $response->assertJson(['attempt' => null]);
    }

    public function test_a_different_guests_attempt_is_never_returned(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        QuizAttempt::query()->create([
            'guest_token' => 'someone-elses-token',
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/quizzes/{$quiz->id}/attempts/latest", [
            'X-Guest-Token' => 'guest-abc',
        ]);

        $response->assertOk();
        $response->assertJson(['attempt' => null]);
    }

    public function test_authenticated_user_gets_their_own_latest_completed_attempt(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $quiz = Quiz::factory()->create(['is_active' => true]);

        QuizAttempt::query()->create([
            'user_id' => $otherUser->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $older = QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 2,
            'score' => 40,
            'started_at' => now()->subDay(),
            'completed_at' => now()->subDay(),
        ]);

        $latest = QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 4,
            'score' => 80,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/v1/quizzes/{$quiz->id}/attempts/latest");

        $response->assertOk();
        $response->assertJsonPath('attempt.id', $latest->id);
        $this->assertNotEquals($older->id, $response->json('attempt.id'));
    }
}
