<?php

namespace Tests\Feature\Admin;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttemptListTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_admin_attempt_list(): void
    {
        $response = $this->getJson('/api/v1/admin/attempts');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_view_admin_attempt_list(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/attempts');

        $response->assertForbidden();
    }

    public function test_admin_sees_attempts_from_all_users(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $quiz = Quiz::factory()->create();

        $attemptA = QuizAttempt::query()->create([
            'user_id' => $userA->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 3,
            'score' => 60,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $attemptB = QuizAttempt::query()->create([
            'user_id' => $userB->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/attempts');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEqualsCanonicalizing([$attemptA->id, $attemptB->id], $ids->all());
        $userIds = collect($response->json('data'))->pluck('user.id');
        $this->assertEqualsCanonicalizing([$userA->id, $userB->id], $userIds->all());
    }

    public function test_admin_can_filter_attempts_by_user(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $quiz = Quiz::factory()->create();

        $attemptA = QuizAttempt::query()->create([
            'user_id' => $userA->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 3,
            'score' => 60,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        QuizAttempt::query()->create([
            'user_id' => $userB->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/attempts?user_id='.$userA->id);

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertEquals([$attemptA->id], $ids->all());
    }
}
