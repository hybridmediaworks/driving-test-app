<?php

namespace App\Policies;

use App\Enums\Feature;
use App\Models\Flashcard;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;

class FlashcardPolicy
{
    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * Can see the card exists (front text, teaser) — matches QuizPolicy::view().
     */
    public function view(?User $user, Flashcard $flashcard): bool
    {
        return $flashcard->is_active;
    }

    /**
     * Can see the back of the card (the actual study content).
     */
    public function readFull(?User $user, Flashcard $flashcard): bool
    {
        if (! $flashcard->is_active) {
            return false;
        }

        if (! $flashcard->is_premium) {
            return true;
        }

        return $this->entitlement->resolve($user)->hasFeature(Feature::Flashcards);
    }
}
