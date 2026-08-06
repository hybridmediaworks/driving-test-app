<?php

namespace App\Policies;

use App\Enums\Feature;
use App\Models\User;
use App\Models\Video;
use App\Services\Entitlement\EntitlementResolver;

class VideoPolicy
{
    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * Can see the video exists (title, description, thumbnail, duration) — matches
     * CheatSheetPolicy::view().
     */
    public function view(?User $user, Video $video): bool
    {
        return $video->is_active;
    }

    /**
     * Can resolve the actual playable url.
     */
    public function watch(?User $user, Video $video): bool
    {
        if (! $video->is_active) {
            return false;
        }

        if (! $video->is_premium) {
            return true;
        }

        return $this->entitlement->resolve($user)->hasFeature(Feature::Videos);
    }
}
