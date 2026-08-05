<?php

namespace App\Policies;

use App\Enums\Feature;
use App\Models\Quiz;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;

class QuizPolicy
{
    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * Can see the quiz exists (title, question count, cover, teaser) — unchanged from before
     * entitlements existed. Deliberately does not gate on `is_premium`: a premium quiz's
     * existence/metadata stays visible to everyone, only attempting it is gated (see `attempt()`).
     */
    public function view(?User $user, Quiz $quiz): bool
    {
        return $quiz->is_active;
    }

    /**
     * Can actually take (submit answers for) the quiz. This is the real hard gate for premium
     * quizzes — including `is_premium` exam-simulator quizzes, which use this exact same check,
     * not a separate one.
     */
    public function attempt(?User $user, Quiz $quiz): bool
    {
        if (! $quiz->is_active) {
            return false;
        }

        if (! $quiz->is_premium) {
            return true;
        }

        return $this->entitlement->resolve($user)->hasFeature(Feature::PremiumQuiz);
    }
}
