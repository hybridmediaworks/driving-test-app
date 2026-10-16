<?php

namespace App\Services\Entitlement;

use App\Enums\BillingInterval;
use App\Enums\EntitlementStatus;
use App\Enums\EntitlementTier;
use App\Enums\FamilyInviteStatus;
use App\Enums\FamilyMemberRole;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\VehicleType;

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

        $grants = array_values(array_filter([
            $this->familyGrant($user),
            ...$this->subscriptionGrants($user),
            $this->storeGrant($user),
        ]));

        if ($grants === []) {
            return new Entitlement(
                tier: EntitlementTier::Free,
                status: EntitlementStatus::Expired,
                accessUntil: null,
                familyGroupId: null,
                isAdmin: $isAdmin,
                vehicleTypeIds: [],
            );
        }

        usort($grants, fn (AccessGrant $a, AccessGrant $b): int => $this->statusRank($a) <=> $this->statusRank($b));
        $primary = $grants[0];

        $vehicleTypeIds = [];
        foreach ($grants as $grant) {
            if ($grant->vehicleTypeId === null) {
                $vehicleTypeIds = null;
                break;
            }
            $vehicleTypeIds[] = $grant->vehicleTypeId;
        }

        return new Entitlement(
            tier: $primary->tier,
            status: $primary->status,
            accessUntil: $primary->accessUntil,
            familyGroupId: collect($grants)->first(fn (AccessGrant $grant) => $grant->familyGroupId !== null)?->familyGroupId,
            isAdmin: $isAdmin,
            vehicleTypeIds: $vehicleTypeIds === null ? null : array_values(array_unique($vehicleTypeIds)),
        );
    }

    public function premiumVehicleTypeNames(Entitlement $entitlement): array
    {
        if (! $entitlement->hasPaidAccess()) {
            return [];
        }

        return VehicleType::query()
            ->when($entitlement->vehicleTypeIds !== null, fn ($query) => $query->whereIn('id', $entitlement->vehicleTypeIds))
            ->orderBy('id')
            ->pluck('name')
            ->all();
    }

    private function guest(): Entitlement
    {
        return new Entitlement(
            tier: EntitlementTier::Guest,
            status: EntitlementStatus::Expired,
            accessUntil: null,
            familyGroupId: null,
            isAdmin: false,
            vehicleTypeIds: [],
        );
    }

    private function statusRank(AccessGrant $grant): int
    {
        return $grant->status === EntitlementStatus::Active ? 0 : 1;
    }

    private function familyGrant(User $user): ?AccessGrant
    {
        $membership = $user->familyMembership()->with('familyGroup.plan')->first();

        if ($membership === null || $membership->invite_status !== FamilyInviteStatus::Claimed) {
            return null;
        }

        $group = $membership->familyGroup;
        if ($group === null || ! $group->isActive()) {
            return null;
        }

        return new AccessGrant(
            tier: $membership->role === FamilyMemberRole::Owner
                ? EntitlementTier::LifetimeFamilyOwner
                : EntitlementTier::LifetimeFamilyMember,
            status: EntitlementStatus::Active,
            accessUntil: null, // lifetime — no expiry
            vehicleTypeId: $group->plan?->vehicle_type_id,
            familyGroupId: $group->id,
        );
    }

    private function subscriptionGrants(User $user): array
    {
        $subscriptions = $user->subscriptions;
        if ($subscriptions->isEmpty()) {
            return [];
        }

        $plans = Plan::query()
            ->whereIn('stripe_price_id', $subscriptions->pluck('stripe_price')->filter()->all())
            ->get()
            ->keyBy('stripe_price_id');

        $grants = [];

        foreach ($subscriptions as $subscription) {
            $plan = $plans->get($subscription->stripe_price);
            if ($plan === null) {
                continue;
            }

            if ($subscription->active()) {
                $grants[] = new AccessGrant(
                    tier: $this->tierFor($plan),
                    status: EntitlementStatus::Active,
                    accessUntil: $subscription->ends_at,
                    vehicleTypeId: $plan->vehicle_type_id,
                );

                continue;
            }

            if ($subscription->pastDue() && $subscription->past_due_since !== null) {
                $graceDeadline = $subscription->past_due_since->copy()->addDays((int) config('billing.past_due_grace_days'));

                if (now()->lessThan($graceDeadline)) {
                    $grants[] = new AccessGrant(
                        tier: $this->tierFor($plan),
                        status: EntitlementStatus::GracePeriod,
                        accessUntil: $graceDeadline,
                        vehicleTypeId: $plan->vehicle_type_id,
                    );
                }
            }
        }

        return $grants;
    }

    // Premium bought through the mobile stores (Apple/Google), synced from RevenueCat's webhook
    // into `revenuecat_premium_until`.
    private function storeGrant(User $user): ?AccessGrant
    {
        if ($user->revenuecat_premium_until === null || ! $user->revenuecat_premium_until->isFuture()) {
            return null;
        }

        return new AccessGrant(
            tier: EntitlementTier::MonthlySubscriber,
            status: EntitlementStatus::Active,
            accessUntil: $user->revenuecat_premium_until,
            vehicleTypeId: null,
        );
    }

    private function tierFor(Plan $plan): EntitlementTier
    {
        return match ($plan->key) {
            'weekly' => EntitlementTier::WeeklySubscriber,
            'monthly' => EntitlementTier::MonthlySubscriber,
            default => $plan->billing_interval === BillingInterval::Week
                ? EntitlementTier::WeeklySubscriber
                : EntitlementTier::MonthlySubscriber,
        };
    }
}
