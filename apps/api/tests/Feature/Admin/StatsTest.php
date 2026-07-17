<?php

namespace Tests\Feature\Admin;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_stats(): void
    {
        $response = $this->getJson('/api/v1/admin/stats');

        $response->assertUnauthorized();
    }

    public function test_non_admin_cannot_view_stats(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/stats');

        $response->assertForbidden();
    }

    public function test_admin_sees_aggregate_counts(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        User::factory()->count(2)->create();

        $quiz = Quiz::factory()->create(['is_active' => true]);
        Quiz::factory()->create(['is_active' => false]);
        QuizQuestion::factory()->count(2)->create(['quiz_id' => $quiz->id]);

        QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 2,
            'correct_count' => 2,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);
        QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::InProgress,
            'total_questions' => 2,
            'correct_count' => 0,
            'score' => 0,
            'started_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats');

        $response->assertOk();
        $response->assertJsonStructure([
            'users' => ['total', 'admins', 'verified', 'new_last_7_days'],
            'quizzes' => ['total', 'active', 'categories', 'questions'],
            'attempts' => ['total', 'completed', 'in_progress', 'average_score', 'last_7_days'],
        ]);

        $response->assertJsonPath('users.total', 3);
        $response->assertJsonPath('users.admins', 1);
        $response->assertJsonPath('quizzes.total', 2);
        $response->assertJsonPath('quizzes.active', 1);
        $response->assertJsonPath('quizzes.questions', 2);
        $response->assertJsonPath('attempts.total', 2);
        $response->assertJsonPath('attempts.completed', 1);
        $response->assertJsonPath('attempts.in_progress', 1);
        $this->assertEquals(100.0, $response->json('attempts.average_score'));
    }
}
