<?php

namespace App\Policies;

use App\Enums\Feature;
use App\Models\CheatSheet;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;

class CheatSheetPolicy
{
    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * Can see the sheet exists (title, summary, cover) — matches QuizPolicy::view().
     */
    public function view(?User $user, CheatSheet $cheatSheet): bool
    {
        return $cheatSheet->is_active;
    }

    /**
     * Can read the full sections and download the PDF.
     */
    public function readFull(?User $user, CheatSheet $cheatSheet): bool
    {
        if (! $cheatSheet->is_active) {
            return false;
        }

        if (! $cheatSheet->is_premium) {
            return true;
        }

        return $this->entitlement->resolve($user)->hasFeature(Feature::CheatSheets);
    }
}
