<?php

namespace Tests\Feature\State;

use App\Enums\AttemptStatus;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\State;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StateStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_zeroed_stats_for_a_state_with_no_attempts(): void
    {
        $state = State::factory()->create(['code' => 'CA']);

        $response = $this->getJson('/api/v1/states/CA/stats');

        $response->assertOk();
        $response->assertJsonPath('state.code', 'CA');
        $response->assertJsonPath('stats.active_today', 0);
        $response->assertJsonPath('stats.students_practiced_30d', 0);
        $response->assertJsonPath('stats.questions_answered_total', 0);
        $response->assertJsonPath('stats.avg_session_seconds', null);
        $response->assertJsonPath('stats.peak_hour', null);
    }

    public function test_it_counts_distinct_users_and_guests_from_completed_attempts_in_the_last_30_days(): void
    {
        $state = State::factory()->create(['code' => 'CA']);
        $quiz = Quiz::factory()->create(['state_id' => $state->id]);
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $userC = User::factory()->create();

        // Same logged-in user, two attempts — counts once.
        QuizAttempt::query()->create([
            'user_id' => $userA->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 10,
            'duration_seconds' => 120,
            'started_at' => now()->subDays(1),
            'completed_at' => now()->subDays(1),
        ]);
        QuizAttempt::query()->create([
            'user_id' => $userA->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'duration_seconds' => 100,
            'started_at' => now()->subDays(2),
            'completed_at' => now()->subDays(2),
        ]);
        // A guest — counts as a second, distinct participant.
        QuizAttempt::query()->create([
            'guest_token' => 'guest-a',
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 8,
            'duration_seconds' => 140,
            'started_at' => now()->subDays(3),
            'completed_at' => now()->subDays(3),
        ]);
        // Outside the 30-day window — excluded.
        QuizAttempt::query()->create([
            'user_id' => $userB->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 20,
            'duration_seconds' => 90,
            'started_at' => now()->subDays(40),
            'completed_at' => now()->subDays(40),
        ]);
        // In-progress — excluded from the completed-based figures.
        QuizAttempt::query()->create([
            'user_id' => $userC->id,
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::InProgress,
            'total_questions' => 10,
            'started_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/states/CA/stats');

        $response->assertOk();
        $response->assertJsonPath('stats.students_practiced_30d', 2);
        $response->assertJsonPath('stats.questions_answered_total', 23);
    }

    public function test_it_scopes_by_vehicle_type_when_given(): void
    {
        $state = State::factory()->create(['code' => 'CA']);
        $car = VehicleType::factory()->create(['name' => 'car']);
        $motorcycle = VehicleType::factory()->create(['name' => 'motorcycle']);

        $carQuiz = Quiz::factory()->create(['state_id' => $state->id, 'vehicle_type_id' => $car->id]);
        $motoQuiz = Quiz::factory()->create(['state_id' => $state->id, 'vehicle_type_id' => $motorcycle->id]);
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        QuizAttempt::query()->create([
            'user_id' => $userA->id,
            'quiz_id' => $carQuiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 10,
            'started_at' => now(),
            'completed_at' => now(),
        ]);
        QuizAttempt::query()->create([
            'user_id' => $userB->id,
            'quiz_id' => $motoQuiz->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 15,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/states/CA/stats?vehicle_type=car');

        $response->assertOk();
        $response->assertJsonPath('stats.students_practiced_30d', 1);
        $response->assertJsonPath('stats.questions_answered_total', 10);
    }

    public function test_it_404s_for_an_unknown_state_code(): void
    {
        $response = $this->getJson('/api/v1/states/ZZ/stats');

        $response->assertNotFound();
    }
}
