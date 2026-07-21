<?php

namespace Tests\Unit;

use App\Enums\EntitlementStatus;
use App\Enums\EntitlementTier;
use App\Enums\Feature;
use App\Models\FamilyGroup;
use App\Models\FamilyMember;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntitlementResolverTest extends TestCase
{
    use RefreshDatabase;

    private EntitlementResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = app(EntitlementResolver::class);
    }

    public function test_guest_resolves_to_guest_tier_and_is_not_premium(): void
    {
        $entitlement = $this->resolver->resolve(null);

        $this->assertSame(EntitlementTier::Guest, $entitlement->tier);
        $this->assertSame(EntitlementStatus::Expired, $entitlement->status);
        $this->assertFalse($entitlement->isPremium());
        $this->assertFalse($entitlement->hasFeature(Feature::PremiumQuiz));
    }

    public function test_registered_user_with_no_subscription_resolves_to_free_tier(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $entitlement = $this->resolver->resolve($user);

        $this->assertSame(EntitlementTier::Free, $entitlement->tier);
        $this->assertSame(EntitlementStatus::Expired, $entitlement->status);
        $this->assertFalse($entitlement->isPremium());
    }

    public function test_admin_is_premium_regardless_of_subscription_but_keeps_their_real_tier(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $entitlement = $this->resolver->resolve($admin);

        // The admin bypass is a separate axis — it must not overwrite the real underlying tier.
        $this->assertSame(EntitlementTier::Free, $entitlement->tier);
        $this->assertTrue($entitlement->isAdmin);
        $this->assertTrue($entitlement->isPremium());
        $this->assertTrue($entitlement->hasFeature(Feature::AiTutor));
    }

    public function test_active_weekly_subscriber_is_premium(): void
    {
        Plan::factory()->create(['key' => 'weekly', 'stripe_price_id' => 'price_weekly_test']);
        $user = User::factory()->create(['is_admin' => false]);
        $this->makeSubscription($user, 'price_weekly_test', 'active');

        $entitlement = $this->resolver->resolve($user);

        $this->assertSame(EntitlementTier::WeeklySubscriber, $entitlement->tier);
        $this->assertSame(EntitlementStatus::Active, $entitlement->status);
        $this->assertTrue($entitlement->isPremium());
    }

    public function test_active_monthly_subscriber_is_premium(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_monthly_test']);
        $user = User::factory()->create(['is_admin' => false]);
        $this->makeSubscription($user, 'price_monthly_test', 'active');

        $entitlement = $this->resolver->resolve($user);

        $this->assertSame(EntitlementTier::MonthlySubscriber, $entitlement->tier);
        $this->assertTrue($entitlement->isPremium());
    }

    public function test_canceled_subscription_still_active_within_its_paid_period(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_monthly_test']);
        $user = User::factory()->create(['is_admin' => false]);
        $this->makeSubscription($user, 'price_monthly_test', 'active', endsAt: now()->addDays(5));

        $entitlement = $this->resolver->resolve($user);

        $this->assertTrue($entitlement->isPremium());
        $this->assertNotNull($entitlement->accessUntil);
        $this->assertTrue($entitlement->accessUntil->isFuture());
    }

    public function test_subscription_past_its_paid_period_is_not_premium(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_monthly_test']);
        $user = User::factory()->create(['is_admin' => false]);
        $this->makeSubscription($user, 'price_monthly_test', 'active', endsAt: now()->subDay());

        $entitlement = $this->resolver->resolve($user);

        $this->assertFalse($entitlement->isPremium());
        $this->assertSame(EntitlementTier::Free, $entitlement->tier);
    }

    public function test_past_due_subscription_within_the_grace_window_is_still_premium(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_monthly_test']);
        $user = User::factory()->create(['is_admin' => false]);
        $this->makeSubscription($user, 'price_monthly_test', 'past_due', pastDueSince: now()->subDay());

        $entitlement = $this->resolver->resolve($user);

        $this->assertSame(EntitlementStatus::GracePeriod, $entitlement->status);
        $this->assertSame(EntitlementTier::MonthlySubscriber, $entitlement->tier);
        $this->assertTrue($entitlement->isPremium());
    }

    public function test_past_due_subscription_beyond_the_grace_window_is_not_premium(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_monthly_test']);
        $user = User::factory()->create(['is_admin' => false]);
        // Default grace window is 3 days (config/billing.php) — 10 days ago is well past it.
        $this->makeSubscription($user, 'price_monthly_test', 'past_due', pastDueSince: now()->subDays(10));

        $entitlement = $this->resolver->resolve($user);

        $this->assertFalse($entitlement->isPremium());
        $this->assertSame(EntitlementTier::Free, $entitlement->tier);
    }

    public function test_lifetime_family_owner_is_premium_with_no_access_expiry(): void
    {
        $owner = User::factory()->create(['is_admin' => false]);
        $group = $this->makeFamilyGroup($owner);
        FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        $entitlement = $this->resolver->resolve($owner);

        $this->assertSame(EntitlementTier::LifetimeFamilyOwner, $entitlement->tier);
        $this->assertTrue($entitlement->isPremium());
        $this->assertNull($entitlement->accessUntil);
        $this->assertSame($group->id, $entitlement->familyGroupId);
    }

    public function test_lifetime_family_member_seat_is_premium(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create(['is_admin' => false]);
        $group = $this->makeFamilyGroup($owner);
        FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $member->id,
            'role' => 'member',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        $entitlement = $this->resolver->resolve($member);

        $this->assertSame(EntitlementTier::LifetimeFamilyMember, $entitlement->tier);
        $this->assertTrue($entitlement->isPremium());
    }

    public function test_pending_unclaimed_family_invite_grants_no_access(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create(['is_admin' => false]);
        $group = $this->makeFamilyGroup($owner);
        FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $invitee->id,
            'role' => 'member',
            'invite_status' => 'pending',
        ]);

        $entitlement = $this->resolver->resolve($invitee);

        $this->assertFalse($entitlement->isPremium());
        $this->assertSame(EntitlementTier::Free, $entitlement->tier);
    }

    public function test_refunded_family_group_grants_no_access_to_its_members(): void
    {
        $owner = User::factory()->create(['is_admin' => false]);
        $group = $this->makeFamilyGroup($owner, status: 'refunded');
        FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        $entitlement = $this->resolver->resolve($owner);

        $this->assertFalse($entitlement->isPremium());
    }

    public function test_family_membership_wins_over_an_expired_individual_subscription(): void
    {
        Plan::factory()->create(['key' => 'monthly', 'stripe_price_id' => 'price_monthly_test']);
        $owner = User::factory()->create(['is_admin' => false]);
        // A lapsed individual subscription alongside an active family seat — family wins.
        $this->makeSubscription($owner, 'price_monthly_test', 'active', endsAt: now()->subDay());
        $group = $this->makeFamilyGroup($owner);
        FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        $entitlement = $this->resolver->resolve($owner);

        $this->assertSame(EntitlementTier::LifetimeFamilyOwner, $entitlement->tier);
        $this->assertTrue($entitlement->isPremium());
    }

    private function makeSubscription(
        User $user,
        string $stripePriceId,
        string $stripeStatus,
        ?\Illuminate\Support\Carbon $endsAt = null,
        ?\Illuminate\Support\Carbon $pastDueSince = null,
    ): Subscription {
        return Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_'.uniqid(),
            'stripe_status' => $stripeStatus,
            'stripe_price' => $stripePriceId,
            'quantity' => 1,
            'ends_at' => $endsAt,
            'past_due_since' => $pastDueSince,
        ]);
    }

    private function makeFamilyGroup(User $owner, string $status = 'active'): FamilyGroup
    {
        $plan = Plan::query()->firstOrCreate(
            ['key' => 'lifetime_family'],
            ['name' => 'Lifetime Family', 'type' => 'one_time', 'price_cents' => 19900, 'max_seats' => 3],
        );

        return FamilyGroup::query()->create([
            'owner_user_id' => $owner->id,
            'plan_id' => $plan->id,
            'max_seats' => 3,
            'status' => $status,
            'purchased_at' => now(),
        ]);
    }
}
