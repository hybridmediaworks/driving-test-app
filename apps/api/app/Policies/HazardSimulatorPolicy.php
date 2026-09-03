<?php

namespace App\Policies;

use App\Enums\Feature;
use App\Models\HazardSimulator;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;

/**
 * Models VideoPolicy 1:1 — a hazard simulator is gated exactly like the video it sits on.
 * `view` = the teaser (metadata, category chips, demo count). `attempt` = actually running it
 * (playback manifest + scoring), which needs the Videos feature for a premium simulator.
 */
class HazardSimulatorPolicy
{
    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    public function view(?User $user, HazardSimulator $simulator): bool
    {
        return $simulator->is_active && $simulator->video?->is_active !== false;
    }

    public function attempt(?User $user, HazardSimulator $simulator): bool
    {
        if (! $simulator->is_active || $simulator->video?->is_active === false) {
            return false;
        }

        if (! $simulator->video?->is_premium) {
            return true;
        }

        return $this->entitlement->resolve($user)->hasFeature(Feature::Videos);
    }
}
