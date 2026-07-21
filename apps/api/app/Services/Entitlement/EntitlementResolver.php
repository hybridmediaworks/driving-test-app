<?php

namespace App\Services\Entitlement;

use App\Enums\EntitlementStatus;
use App\Enums\EntitlementTier;
use App\Enums\FamilyInviteStatus;
use App\Enums\FamilyMemberRole;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * The single source of truth for "what can this user access." Sanctum tokens never expire
 * (config/sanctum.php `expiration => null`), so a lapsed subscription can't be inferred from
 * token state — every premium-content request must resolve entitlement live, which is exactly
 * what this service exists to make cheap and consistent to do.
 */
class EntitlementResolver
{
    public function resolve(?User $user): Entitlement
    {
        if ($user === null) {
            return $this->guest();
        }

        // A just-created User model (e.g. straight out of AuthController::register()) may not have
        // is_admin loaded in memory even though the users table defaults it to false at the DB
        // level — Eloquent doesn't reflect DB-applied defaults back onto the instance that
        // triggered the insert. Coerce rather than trust the raw value is already a bool.
        $isAdmin = (bool) $user->is_admin;

        $familyEntitlement = $this->resolveFamilyMembership($user, $isAdmin);
        if ($familyEntitlement !== null) {
            return $familyEntitlement;
        }

        $subscription = $user->subscription('default');

        if ($subscription !== null && $subscription->active()) {
            return new Entitlement(
                tier: $this->tierForStripePrice($subscription->stripe_price),
                status: EntitlementStatus::Active,
                // null while still auto-renewing; only set once canceled (access continues until
                // this date, matching Cashier's own cancel()-not-cancelNow() behavior).
                accessUntil: $subscription->ends_at,
                familyGroupId: null,
                isAdmin: $isAdmin,
            );
        }

        if ($subscription !== null && $subscription->pastDue() && $subscription->past_due_since !== null) {
            $graceDeadline = $subscription->past_due_since->copy()->addDays((int) config('billing.past_due_grace_days'));

            if (now()->lessThan($graceDeadline)) {
                return new Entitlement(
                    tier: $this->tierForStripePrice($subscription->stripe_price),
                    status: EntitlementStatus::GracePeriod,
                    accessUntil: $graceDeadline,
                    familyGroupId: null,
                    isAdmin: $isAdmin,
                );
            }
        }

        return new Entitlement(
            tier: EntitlementTier::Free,
            status: EntitlementStatus::Expired,
            accessUntil: null,
            familyGroupId: null,
            isAdmin: $isAdmin,
        );
    }

    private function guest(): Entitlement
    {
        return new Entitlement(
            tier: EntitlementTier::Guest,
            status: EntitlementStatus::Expired,
            accessUntil: null,
            familyGroupId: null,
            isAdmin: false,
        );
    }

    private function resolveFamilyMembership(User $user, bool $isAdmin): ?Entitlement
    {
        $membership = $user->familyMembership()->with('familyGroup')->first();

        if ($membership === null || $membership->invite_status !== FamilyInviteStatus::Claimed) {
            return null;
        }

        $group = $membership->familyGroup;
        if ($group === null || ! $group->isActive()) {
            return null;
        }

        $tier = $membership->role === FamilyMemberRole::Owner
            ? EntitlementTier::LifetimeFamilyOwner
            : EntitlementTier::LifetimeFamilyMember;

        return new Entitlement(
            tier: $tier,
            status: EntitlementStatus::Active,
            accessUntil: null, // lifetime — no expiry
            familyGroupId: $group->id,
            isAdmin: $isAdmin,
        );
    }

    private function tierForStripePrice(?string $stripePriceId): EntitlementTier
    {
        if ($stripePriceId === null) {
            return EntitlementTier::Free;
        }

        $plan = Plan::query()->where('stripe_price_id', $stripePriceId)->first();

        return match ($plan?->key) {
            'weekly' => EntitlementTier::WeeklySubscriber,
            'monthly' => EntitlementTier::MonthlySubscriber,
            default => EntitlementTier::Free,
        };
    }
}
