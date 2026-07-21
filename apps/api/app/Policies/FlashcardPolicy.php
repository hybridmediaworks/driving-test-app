<?php

namespace App\Policies;

use App\Models\Flashcard;
use App\Models\User;

class FlashcardPolicy
{
    /**
     * Can see the card exists (front text, teaser) — matches QuizPolicy::view().
     */
    public function view(?User $user, Flashcard $flashcard): bool
    {
        return $flashcard->is_active;
    }

    /**
     * Can see the back of the card (the actual study content).
     *
     * Interim gate — swap the body for
     * `$this->entitlement->resolve($user)->hasFeature(Feature::Flashcards)` the moment
     * EntitlementResolver exists (see docs/SUBSCRIPTION_ROADMAP.md); nothing upstream changes.
     */
    public function readFull(?User $user, Flashcard $flashcard): bool
    {
        if (! $flashcard->is_active) {
            return false;
        }

        if (! $flashcard->is_premium) {
            return true;
        }

        return $user?->is_admin ?? false;
    }
}
