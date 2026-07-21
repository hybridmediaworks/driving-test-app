<?php

namespace App\Services\Entitlement;

use App\Enums\EntitlementStatus;
use App\Enums\EntitlementTier;
use App\Enums\Feature;
use Illuminate\Support\Carbon;

final readonly class Entitlement
{
    public function __construct(
        public EntitlementTier $tier,
        public EntitlementStatus $status,
        public ?Carbon $accessUntil,
        public ?int $familyGroupId,
        public bool $isAdmin,
    ) {}

    /**
     * True for admins (a QA bypass, kept separate from the tier itself — see EntitlementResolver)
     * or anyone on an active/grace-period paid tier. False for guest, free, or anyone expired,
     * even if they were once paid.
     */
    public function isPremium(): bool
    {
        if ($this->isAdmin) {
            return true;
        }

        if (! in_array($this->status, [EntitlementStatus::Active, EntitlementStatus::GracePeriod], true)) {
            return false;
        }

        return ! in_array($this->tier, [EntitlementTier::Guest, EntitlementTier::Free], true);
    }

    /**
     * Per-feature check, not a blanket alias for isPremium() — every paid tier unlocks every
     * feature identically today (see docs/SUBSCRIPTION_ROADMAP.md), but keeping this as a real
     * per-feature switch means a future divergence (e.g. Weekly excluding the AI tutor) only
     * changes this one method, not every call site across the app.
     */
    public function hasFeature(Feature $feature): bool
    {
        return $this->isPremium();
    }
}
