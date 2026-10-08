<?php

namespace Tests\Feature\Admin;

use App\Enums\AttemptStatus;
use App\Models\CheatSheet;
use App\Models\FamilyGroup;
use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\PassGuaranteeClaim;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\State;
use App\Models\Subscription;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * QuizAttempt has no factory, so build the minimum a stats query reads. `created_at` is set
     * after the insert: it is not fillable, so passing it to create() silently drops it and every
     * row lands on today — which is exactly what these tests are trying to tell apart.
     */
    private function makeAttempts(int $quizId, int $count, \DateTimeInterface $at): void
    {
        for ($i = 0; $i < $count; $i++) {
            QuizAttempt::query()->create([
                'quiz_id' => $quizId,
                'status' => AttemptStatus::Completed,
                'total_questions' => 1,
                'correct_count' => 1,
                'score' => 100,
                'started_at' => $at,
                'completed_at' => $at,
            ])->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
        }
    }

    /** Same reason as makeAttempts: created_at is not fillable on User either. */
    private function makeUserAt(\DateTimeInterface $at): void
    {
        User::factory()->create()->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
    }

    public function test_the_library_is_broken_down_by_vehicle_type(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $car = VehicleType::query()->firstOrCreate(['name' => 'car'], ['title' => 'Car']);
        $moto = VehicleType::query()->firstOrCreate(['name' => 'motorcycle'], ['title' => 'Motorcycle']);

        $carQuiz = Quiz::factory()->create(['vehicle_type_id' => $car->id]);
        $motoQuiz = Quiz::factory()->create(['vehicle_type_id' => $moto->id]);
        QuizQuestion::factory()->count(3)->create(['quiz_id' => $carQuiz->id]);
        QuizQuestion::factory()->create(['quiz_id' => $motoQuiz->id]);

        $byVehicle = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats')
            ->assertOk()
            ->json('content.questions_by_vehicle');

        // Largest first, so the headline breakdown reads without the client re-sorting it.
        $this->assertSame('car', $byVehicle[0]['name']);
        $this->assertSame(3, $byVehicle[0]['questions']);
        $this->assertSame('motorcycle', $byVehicle[1]['name']);
        $this->assertSame(1, $byVehicle[1]['questions']);
    }

    public function test_today_counts_only_cover_today(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $quiz = Quiz::factory()->create();

        $this->makeUserAt(now()->subDay());
        $this->makeUserAt(now());

        $this->makeAttempts($quiz->id, 1, now()->subDay());
        $this->makeAttempts($quiz->id, 2, now());

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats');

        // The admin account itself was made just now, so it counts too.
        $response->assertOk()
            ->assertJsonPath('users.new_today', 2)
            ->assertJsonPath('attempts.today', 2);
    }

    public function test_top_states_are_ranked_and_the_rest_are_summed(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        // Six states so one of them has to fall outside the top five.
        $volumes = ['CA' => 9, 'TX' => 7, 'NY' => 5, 'FL' => 4, 'OH' => 3, 'WY' => 2];
        foreach ($volumes as $code => $count) {
            $state = State::factory()->create(['code' => $code, 'name' => $code]);
            $quiz = Quiz::factory()->create(['state_id' => $state->id]);
            $this->makeAttempts($quiz->id, $count, now());
        }

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats');

        $response->assertOk()
            ->assertJsonCount(5, 'activity.top_states_last_7_days.states')
            ->assertJsonPath('activity.top_states_last_7_days.states.0.code', 'CA')
            ->assertJsonPath('activity.top_states_last_7_days.states.0.total', 9)
            ->assertJsonPath('activity.top_states_last_7_days.states.4.code', 'OH')
            // Wyoming misses the cut, so its two attempts show up in the combined row rather
            // than vanishing — a five-line chart that silently drops the rest misleads.
            ->assertJsonPath('activity.top_states_last_7_days.others_total', 2);
    }

    public function test_each_top_state_carries_seven_daily_figures(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $state = State::factory()->create(['code' => 'CA', 'name' => 'California']);
        $quiz = Quiz::factory()->create(['state_id' => $state->id]);

        $this->makeAttempts($quiz->id, 2, now());
        $this->makeAttempts($quiz->id, 1, now()->subDays(3));
        // Outside the window entirely.
        $this->makeAttempts($quiz->id, 1, now()->subDays(20));

        $daily = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats')
            ->assertOk()
            ->json('activity.top_states_last_7_days.states.0.daily');

        $this->assertCount(7, $daily);
        $this->assertSame(2, $daily[6]);  // today, last
        $this->assertSame(1, $daily[3]);  // three days ago
        $this->assertSame(3, array_sum($daily));
    }

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
            'users' => ['total', 'admins', 'verified', 'new_last_7_days', 'daily_new_last_7_days'],
            'quizzes' => ['total', 'active', 'categories', 'questions'],
            'attempts' => ['total', 'completed', 'in_progress', 'average_score', 'last_7_days', 'daily_last_7_days'],
            'content' => [
                'flashcards' => ['total', 'active', 'premium', 'reviews'],
                'cheat_sheets' => ['total', 'active', 'premium'],
            ],
            'billing' => [
                'active_weekly_subscribers', 'active_monthly_subscribers', 'active_family_groups',
                'recurring_revenue_cents', 'claims' => ['submitted', 'under_review', 'approved', 'denied', 'refunded'],
            ],
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
        $this->assertCount(7, $response->json('users.daily_new_last_7_days'));
        $this->assertCount(7, $response->json('attempts.daily_last_7_days'));
    }

    public function test_daily_series_are_zero_filled_and_bucketed_by_day(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $quiz = Quiz::factory()->create();

        // One user created "today" and one attempt created "today" — every other day in the
        // 7-day window has no rows and must still appear as an explicit 0, not be omitted.
        User::factory()->create(['created_at' => now()]);
        QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'status' => AttemptStatus::InProgress,
            'total_questions' => 2,
            'correct_count' => 0,
            'score' => 0,
            'started_at' => now(),
            'created_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats');

        $response->assertOk();
        $dailyUsers = $response->json('users.daily_new_last_7_days');
        $dailyAttempts = $response->json('attempts.daily_last_7_days');

        $this->assertCount(7, $dailyUsers);
        $this->assertCount(7, $dailyAttempts);
        // admin + the one seeded user were both created "today" → last element (today) is 2.
        $this->assertSame(2, $dailyUsers[6]);
        $this->assertSame(0, array_sum(array_slice($dailyUsers, 0, 6)));
        $this->assertSame(1, $dailyAttempts[6]);
        $this->assertSame(0, array_sum(array_slice($dailyAttempts, 0, 6)));
    }

    public function test_admin_sees_content_library_counts(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        Flashcard::factory()->count(2)->create(['is_active' => true, 'is_premium' => false]);
        Flashcard::factory()->create(['is_active' => false, 'is_premium' => true]);
        $reviewedCard = Flashcard::factory()->create(['is_active' => true, 'is_premium' => false]);
        FlashcardReview::factory()->create(['flashcard_id' => $reviewedCard->id, 'status' => 'known']);

        CheatSheet::factory()->create(['is_active' => true, 'is_premium' => false]);
        CheatSheet::factory()->create(['is_active' => false, 'is_premium' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats');

        $response->assertOk();
        $response->assertJsonPath('content.flashcards.total', 4);
        $response->assertJsonPath('content.flashcards.active', 3);
        $response->assertJsonPath('content.flashcards.premium', 1);
        $response->assertJsonPath('content.flashcards.reviews', 1);
        $response->assertJsonPath('content.cheat_sheets.total', 2);
        $response->assertJsonPath('content.cheat_sheets.active', 1);
        $response->assertJsonPath('content.cheat_sheets.premium', 1);
    }

    public function test_admin_sees_billing_counts(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $monthlyPlan = Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_stats_monthly', 'price_cents' => 7500]);
        $weeklyPlan = Plan::factory()->create(['key' => 'weekly', 'stripe_price_id' => 'price_stats_weekly', 'price_cents' => 2900]);

        $subscriber = User::factory()->create();
        Subscription::query()->create([
            'user_id' => $subscriber->id,
            'type' => 'default',
            'stripe_id' => 'sub_stats_1',
            'stripe_status' => 'active',
            'stripe_price' => 'price_stats_monthly',
            'quantity' => 1,
        ]);

        $familyOwner = User::factory()->create();
        FamilyGroup::query()->create([
            'owner_user_id' => $familyOwner->id,
            'plan_id' => Plan::factory()->create(['key' => 'lifetime_family'])->id,
            'max_seats' => 3,
            'status' => 'active',
            'purchased_at' => now(),
        ]);

        PassGuaranteeClaim::query()->create([
            'user_id' => $subscriber->id,
            'status' => 'submitted',
            'completed_practice_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/stats');

        $response->assertOk();
        $response->assertJsonPath('billing.active_monthly_subscribers', 1);
        $response->assertJsonPath('billing.active_weekly_subscribers', 0);
        $response->assertJsonPath('billing.active_family_groups', 1);
        $response->assertJsonPath('billing.recurring_revenue_cents', 7500);
        $response->assertJsonPath('billing.claims.submitted', 1);
    }
}
