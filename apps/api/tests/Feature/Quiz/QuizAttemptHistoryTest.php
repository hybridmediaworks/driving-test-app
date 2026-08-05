<?php

namespace Tests\Feature\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_attempt_history(): void
    {
        $response = $this->getJson('/api/v1/attempts');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_only_sees_their_own_attempts(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $quiz = Quiz::factory()->create();

        $mine = QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 3,
            'score' => 60,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

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

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/attempts');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$mine->id], $ids->all());
    }
}
