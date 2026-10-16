<?php

namespace Tests\Feature\Billing;

use App\Actions\Billing\CreateCheckoutSession;
use App\Enums\Feature;
use App\Models\FamilyGroup;
use App\Models\FamilyMember;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\Subscription;
use App\Models\User;
use App\Models\VehicleType;
use App\Services\Entitlement\EntitlementResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehiclePlanAccessTest extends TestCase
{
    use RefreshDatabase;

    private VehicleType $car;

    private VehicleType $cdl;

    private VehicleType $motorcycle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->car = VehicleType::factory()->create(['name' => 'car', 'title' => 'Car']);
        $this->cdl = VehicleType::factory()->create(['name' => 'cdl', 'title' => 'CDL']);
        $this->motorcycle = VehicleType::factory()->create(['name' => 'motorcycle', 'title' => 'Motorcycle']);
    }

    private function plan(string $key, ?VehicleType $vehicle, string $type = 'recurring'): Plan
    {
        return Plan::factory()->create([
            'key' => $key,
            'vehicle_type_id' => $vehicle?->id,
            'type' => $type,
            'billing_interval' => $type === 'recurring' ? 'month' : null,
            'price_cents' => 7500,
            'stripe_price_id' => "price_{$key}",
            'is_active' => true,
        ]);
    }

    private function subscribe(User $user, Plan $plan): Subscription
    {
        return Subscription::query()->create([
            'user_id' => $user->id,
            'type' => $plan->subscriptionType(),
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => 'active',
            'stripe_price' => $plan->stripe_price_id,
            'quantity' => 1,
        ]);
    }

    private function premiumQuiz(VehicleType $vehicle): Quiz
    {
        return Quiz::factory()->create(['is_active' => true, 'is_premium' => true, 'vehicle_type_id' => $vehicle->id]);
    }

    public function test_a_car_plan_unlocks_car_premium_content_but_not_cdl(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->subscribe($user, $this->plan('monthly', $this->car));

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes/'.$this->premiumQuiz($this->car)->id)
            ->assertOk()
            ->assertJsonPath('locked', false);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/quizzes/'.$this->premiumQuiz($this->cdl)->id)
            ->assertOk()
            ->assertJsonPath('locked', true);
    }

    public function test_any_paid_plan_unlocks_content_that_has_no_vehicle(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->subscribe($user, $this->plan('cdl_monthly', $this->cdl));

        $entitlement = app(EntitlementResolver::class)->resolve($user);

        $this->assertTrue($entitlement->hasFeature(Feature::Flashcards));
        $this->assertTrue($entitlement->hasFeature(Feature::Flashcards, $this->cdl->id));
        $this->assertFalse($entitlement->hasFeature(Feature::Flashcards, $this->car->id));
    }

    public function test_a_car_family_seat_and_a_cdl_subscription_both_count(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $family = FamilyGroup::query()->create([
            'owner_user_id' => $user->id,
            'plan_id' => $this->plan('lifetime_family', $this->car, 'one_time')->id,
            'max_seats' => 3,
            'status' => 'active',
            'purchased_at' => now(),
        ]);
        FamilyMember::query()->create([
            'family_group_id' => $family->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);
        $this->subscribe($user, $this->plan('cdl_monthly', $this->cdl));

        $entitlement = app(EntitlementResolver::class)->resolve($user);

        $this->assertTrue($entitlement->coversVehicle($this->car->id));
        $this->assertTrue($entitlement->coversVehicle($this->cdl->id));
        $this->assertFalse($entitlement->coversVehicle($this->motorcycle->id));
        $this->assertSame($family->id, $entitlement->familyGroupId);
    }

    public function test_a_plan_without_a_vehicle_covers_every_vehicle(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->subscribe($user, $this->plan('all_access', null));

        $entitlement = app(EntitlementResolver::class)->resolve($user);

        foreach ([$this->car, $this->cdl, $this->motorcycle] as $vehicle) {
            $this->assertTrue($entitlement->coversVehicle($vehicle->id));
        }
    }

    public function test_checkout_is_refused_for_a_vehicle_the_user_already_has(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->subscribe($user, $this->plan('monthly', $this->car));
        $this->plan('weekly', $this->car);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/checkout', ['plan_key' => 'weekly'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You already have Premium for Car.');
    }

    public function test_checkout_is_allowed_for_a_different_vehicle(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->subscribe($user, $this->plan('monthly', $this->car));
        $this->plan('cdl_monthly', $this->cdl);

        $this->app->instance(CreateCheckoutSession::class, new class extends CreateCheckoutSession
        {
            public function __invoke(User $user, Plan $plan): string
            {
                return "https://checkout.stripe.com/{$plan->subscriptionType()}";
            }
        });

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/checkout', ['plan_key' => 'cdl_monthly'])
            ->assertOk()
            ->assertJsonPath('checkout_url', 'https://checkout.stripe.com/cdl');
    }

    public function test_checkout_for_a_plan_not_yet_synced_to_stripe_is_refused_cleanly(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Plan::factory()->create(['key' => 'cdl_weekly', 'vehicle_type_id' => $this->cdl->id, 'stripe_price_id' => null]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/checkout', ['plan_key' => 'cdl_weekly'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['plan_key' => 'This plan isn\'t available for purchase yet.']);
    }

    public function test_plans_and_me_expose_vehicle_types(): void
    {
        $this->plan('cdl_monthly', $this->cdl);
        $user = User::factory()->create(['is_admin' => false]);
        $this->subscribe($user, $this->plan('monthly', $this->car));

        $plans = collect($this->getJson('/api/v1/plans')->assertOk()->json('data'))->keyBy('key');
        $this->assertSame('cdl', $plans['cdl_monthly']['vehicle_type']);
        $this->assertSame('car', $plans['monthly']['vehicle_type']);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('user.entitlement.premium_vehicle_types', ['car']);
    }

    public function test_cancel_asks_which_subscription_when_there_are_several(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->subscribe($user, $this->plan('monthly', $this->car));
        $this->subscribe($user, $this->plan('cdl_monthly', $this->cdl));

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/billing/subscription/cancel')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You have more than one subscription — choose which one to cancel.');

        $subscriptions = $this->actingAs($user, 'sanctum')->getJson('/api/v1/billing/subscription')
            ->assertOk()
            ->json('subscriptions');

        $this->assertEqualsCanonicalizing(['car', 'cdl'], array_column($subscriptions, 'vehicle_type'));
    }
}
