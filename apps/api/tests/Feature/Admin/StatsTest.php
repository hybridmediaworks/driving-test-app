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
use App\Models\Subscription;
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
