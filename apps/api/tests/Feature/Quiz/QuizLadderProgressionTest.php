<?php

namespace Tests\Feature\Quiz;

use App\Enums\AttemptStatus;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\Subscription;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizLadderProgressionTest extends TestCase
{
    use RefreshDatabase;

    /** One free then two premium quizzes in the same category/state/vehicle/track ladder. */
    private function buildLadder(): array
    {
        $state = State::factory()->create(['code' => 'AL']);
        $vehicle = VehicleType::factory()->create(['name' => 'car']);
        $category = QuizCategory::factory()->create(['title' => 'The Essentials', 'order_no' => 1, 'is_active' => true]);

        $make = fn (int $order, bool $premium, string $title) => Quiz::factory()->create([
            'is_active' => true,
            'state_id' => $state->id,
            'vehicle_type_id' => $vehicle->id,
            'quiz_category_id' => $category->id,
            'test_track' => 'permit_test',
            'order_no' => $order,
            'is_premium' => $premium,
            'title' => $title,
        ]);

        return [
            'q1' => $make(1, false, 'Test 1'),
            'q2' => $make(2, true, 'Test 2'),
            'q3' => $make(3, true, 'Test 3'),
        ];
    }

    private function makeSubscriber(): User
    {
        Plan::query()->firstOrCreate(
            ['key' => 'monthly'],
            ['name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'stripe_price_id' => 'price_monthly_progression_test'],
        );

        $user = User::factory()->create(['is_admin' => false]);

        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => 'price_monthly_progression_test',
            'quantity' => 1,
        ]);

        return $user;
    }

    private function ladder(): array
    {
        return $this->getJson('/api/v1/quizzes?state=AL&vehicle_type=car&test_track=permit_test&per_page=100')
            ->assertOk()
            ->json('data');
    }

    public function test_guest_sees_free_open_and_premium_gated_by_payment(): void
    {
        $this->buildLadder();

        $data = $this->ladder();

        // Ordered free-first: Test 1, Test 2, Test 3.
        $this->assertSame(['Test 1', 'Test 2', 'Test 3'], array_column($data, 'title'));
        $this->assertNull($data[0]['lock_reason']);
        $this->assertTrue($data[0]['is_next']);
        $this->assertSame('premium', $data[1]['lock_reason']);
        $this->assertSame('premium', $data[2]['lock_reason']);
        $this->assertFalse($data[1]['is_next']);
    }

    public function test_paid_user_sees_the_whole_ladder_open_without_finishing_anything(): void
    {
        $this->buildLadder();
        $user = $this->makeSubscriber();

        $data = collect($this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes?state=AL&vehicle_type=car&test_track=permit_test&per_page=100')->json('data'));

        // Paying is the whole gate: every rung is open straight after subscribing, with nothing
        // completed. is_next still marks the first unfinished one as the suggested starting point.
        $this->assertNull($data[0]['lock_reason']);
        $this->assertNull($data[1]['lock_reason']);
        $this->assertNull($data[2]['lock_reason']);
        $this->assertTrue($data[0]['is_next']);
        $this->assertFalse($data[1]['is_next']);
        $this->assertFalse($data[2]['is_next']);
    }

    public function test_admin_sees_the_whole_ladder_open_without_finishing_anything(): void
    {
        $this->buildLadder();
        $admin = User::factory()->create(['is_admin' => true]);

        $data = collect($this->actingAs($admin, 'sanctum')->getJson('/api/v1/quizzes?state=AL&vehicle_type=car&test_track=permit_test&per_page=100')->json('data'));

        // Admins count as entitled (the QA bypass), so they get the same open ladder as a
        // subscriber — every rung open with nothing completed.
        $this->assertNull($data[0]['lock_reason']);
        $this->assertNull($data[1]['lock_reason']);
        $this->assertNull($data[2]['lock_reason']);

        // is_next still points at the first unfinished quiz.
        $this->assertTrue($data[0]['is_next']);
        $this->assertFalse($data[1]['is_next']);
        $this->assertFalse($data[2]['is_next']);
    }

    public function test_completing_a_quiz_advances_next_for_a_paid_user(): void
    {
        ['q1' => $q1] = $this->buildLadder();
        $user = $this->makeSubscriber();

        QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $q1->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $data = $this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes?state=AL&vehicle_type=car&test_track=permit_test&per_page=100')->json('data');

        // Test 1 done → no longer next; is_next moves to Test 2. Nothing is gated for a
        // subscriber, so Test 3 is open too — it is simply not the suggested one.
        $this->assertTrue($data[0]['attempted']);
        $this->assertFalse($data[0]['is_next']);
        $this->assertNull($data[1]['lock_reason']);
        $this->assertTrue($data[1]['is_next']);
        $this->assertNull($data[2]['lock_reason']);
        $this->assertFalse($data[2]['is_next']);
    }

    public function test_slug_lookup_falls_back_to_payment_only_lock_reason(): void
    {
        ['q2' => $q2] = $this->buildLadder();

        // A non-ladder request (slug lookup) doesn't resolve the ladder — premium still reads as
        // payment-locked for someone who hasn't paid.
        $this->getJson("/api/v1/quizzes?state=AL&slug={$q2->slug}")
            ->assertOk()
            ->assertJsonPath('data.0.lock_reason', 'premium')
            ->assertJsonPath('data.0.is_next', false);
    }

    public function test_completing_a_quiz_advances_the_ladder_for_a_guest_too(): void
    {
        ['q1' => $q1] = $this->buildLadder();
        $headers = ['X-Guest-Token' => 'guest-ladder-progress'];

        QuizAttempt::query()->create([
            'guest_token' => 'guest-ladder-progress',
            'quiz_id' => $q1->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $data = $this
            ->getJson('/api/v1/quizzes?state=AL&vehicle_type=car&test_track=permit_test&per_page=100', $headers)
            ->assertOk()
            ->json('data');

        // Same shape as the paid-user equivalent above: Test 1 done → not next; Test 2 now open +
        // next (still gated by payment for a non-subscriber guest, but that's a separate axis —
        // this asserts is_next tracks completion, not entitlement).
        $this->assertTrue($data[0]['attempted']);
        $this->assertFalse($data[0]['is_next']);

        // A different guest (no matching token) must not see this guest's progress.
        $stranger = $this
            ->getJson('/api/v1/quizzes?state=AL&vehicle_type=car&test_track=permit_test&per_page=100', ['X-Guest-Token' => 'someone-else'])
            ->assertOk()
            ->json('data');
        $this->assertFalse($stranger[0]['attempted']);
        $this->assertTrue($stranger[0]['is_next']);
    }

    public function test_guest_attempted_and_best_score_show_on_a_plain_non_ladder_listing(): void
    {
        ['q1' => $q1] = $this->buildLadder();
        $headers = ['X-Guest-Token' => 'guest-plain-listing'];

        QuizAttempt::query()->create([
            'guest_token' => 'guest-plain-listing',
            'quiz_id' => $q1->id,
            'status' => AttemptStatus::Completed,
            'total_questions' => 5,
            'correct_count' => 5,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        // No state/vehicle_type/test_track together — this is the withMax(best_score) path, not
        // the ResolveQuizProgression ladder path.
        $this->getJson("/api/v1/quizzes?slug={$q1->slug}", $headers)
            ->assertOk()
            ->assertJsonPath('data.0.attempted', true)
            ->assertJsonPath('data.0.user_passed', true);
    }

    /**
     * CDL's optional endorsements sort ahead of the main program on order_no alone (General
     * Knowledge is 0, HazMat is 1), which put the "Next" badge in a section the hub lists below
     * the main program. The main program has to win.
     */
    public function test_cdl_next_lands_in_the_main_program_not_an_endorsement(): void
    {
        $state = State::factory()->create(['code' => 'AL']);
        $vehicle = VehicleType::factory()->create(['name' => 'cdl']);

        $endorsement = QuizCategory::factory()->create(['title' => 'General Knowledge', 'order_no' => 0, 'is_active' => true]);
        $mainProgram = QuizCategory::factory()->create(['title' => 'Hazardous Materials (HazMat)', 'order_no' => 1, 'is_active' => true]);

        foreach ([[$endorsement, 'GK Test 1'], [$mainProgram, 'HazMat Test 1']] as [$category, $title]) {
            Quiz::factory()->create([
                'is_active' => true,
                'state_id' => $state->id,
                'vehicle_type_id' => $vehicle->id,
                'quiz_category_id' => $category->id,
                'test_track' => 'permit_test',
                'order_no' => 1,
                'is_premium' => false,
                'title' => $title,
            ]);
        }

        $data = $this->getJson('/api/v1/quizzes?state=AL&vehicle_type=cdl&test_track=permit_test&per_page=100')
            ->assertOk()
            ->json('data');

        $next = array_column(array_filter($data, fn ($quiz) => $quiz['is_next']), 'title');
        $this->assertSame(['HazMat Test 1'], $next);
    }
}
