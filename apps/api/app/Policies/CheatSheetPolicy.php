<?php

namespace App\Policies;

use App\Models\CheatSheet;
use App\Models\User;

class CheatSheetPolicy
{
    /**
     * Can see the sheet exists (title, summary, cover) — matches QuizPolicy::view().
     */
    public function view(?User $user, CheatSheet $cheatSheet): bool
    {
        return $cheatSheet->is_active;
    }

    /**
     * Can read the full sections and download the PDF.
     *
     * Interim gate — swap the body for
     * `$this->entitlement->resolve($user)->hasFeature(Feature::CheatSheets)` the moment
     * EntitlementResolver exists (see docs/SUBSCRIPTION_ROADMAP.md); nothing upstream changes.
     */
    public function readFull(?User $user, CheatSheet $cheatSheet): bool
    {
        if (! $cheatSheet->is_active) {
            return false;
        }

        if (! $cheatSheet->is_premium) {
            return true;
        }

        return $user?->is_admin ?? false;
    }
}
