<?php

namespace Tests\Feature\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizDeletionProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_a_category_with_quizzes_is_blocked_at_the_database_level(): void
    {
        $category = QuizCategory::factory()->create();
        Quiz::factory()->create(['quiz_category_id' => $category->id]);

        $this->expectException(QueryException::class);

        // Bypasses the controller's app-level guard on purpose — this proves the
        // restrictOnDelete() FK is the actual backstop, not just the controller check.
        $category->delete();
    }

    public function test_deleting_a_quiz_with_attempt_history_is_blocked_at_the_database_level(): void
    {
        $quiz = Quiz::factory()->create();
        QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 1,
            'correct_count' => 1,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        $quiz->delete();
    }

    public function test_admin_delete_category_endpoint_returns_a_friendly_error_when_quizzes_exist(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $category = QuizCategory::factory()->create();
        Quiz::factory()->create(['quiz_category_id' => $category->id]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/quiz-categories/{$category->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('quiz_categories', ['id' => $category->id]);
    }

    public function test_admin_delete_quiz_endpoint_returns_a_friendly_error_when_attempts_exist(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $quiz = Quiz::factory()->create();
        QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 1,
            'correct_count' => 1,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/quizzes/{$quiz->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('quizzes', ['id' => $quiz->id]);
    }

    public function test_admin_delete_quiz_endpoint_succeeds_when_no_attempts_exist(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $quiz = Quiz::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/quizzes/{$quiz->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('quizzes', ['id' => $quiz->id]);
    }
}
