<?php

namespace App\Actions\Quiz;

use App\Enums\AttemptStatus;
use App\Enums\Feature;
use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;

/**
 * Server-side source of truth for the ladder's progressive "finish one to unlock the next" gate,
 * so every client (web and mobile) renders the same lock state instead of each re-deriving it.
 *
 * Walks the ladder in the exact order it is displayed — categories by order_no/title with
 * "The extra support" always last, quizzes within a category by is_premium/order_no/title — and
 * for each quiz decides:
 *   - lock_reason "premium": premium content the viewer isn't entitled to (hasn't paid) → the card
 *     should route to pricing.
 *   - lock_reason "progress": premium content the viewer HAS paid for but hasn't reached yet (the
 *     previous quiz isn't completed) → locked silently, no pricing.
 *   - lock_reason null: open (free, or entitled-and-reached, or already completed).
 *   - is_next: the single first open, not-yet-completed quiz — the one to take now.
 *
 * "Completed" means any completed attempt (score-agnostic), matching the pass line used elsewhere.
 */
class ResolveQuizProgression
{
    private const EXTRA_SUPPORT_TITLE = 'The extra support';

    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * @return array<int, array{lock_reason: 'premium'|'progress'|null, is_next: bool}>
     */
    public function __invoke(string $stateCode, string $vehicleType, string $testTrack, ?User $user, ?string $guestToken = null): array
    {
        $isEntitled = $this->entitlement->resolve($user)->hasFeature(Feature::PremiumQuiz);

        $quizzes = Quiz::query()
            ->where('is_active', true)
            ->forState($stateCode)
            ->forVehicleType($vehicleType)
            ->where('test_track', $testTrack)
            ->when($user !== null || $guestToken !== null, fn ($q) => $q->withMax([
                'attempts as best_score' => fn ($a) => $a
                    ->where('status', AttemptStatus::Completed)
                    ->when(
                        $user !== null,
                        fn ($aq) => $aq->where('user_id', $user->id),
                        fn ($aq) => $aq->where('guest_token', $guestToken),
                    ),
            ], 'score'))
            ->orderBy('is_premium')
            ->orderBy('order_no')
            ->orderBy('title')
            ->get();

        // groupBy preserves the is_premium/order_no/title order above within each category.
        $byCategory = $quizzes->groupBy('quiz_category_id');

        // Display order: order_no/title, but "The extra support" is always the last rung.
        $categories = QuizCategory::query()
            ->where('is_active', true)
            ->orderBy('order_no')
            ->orderBy('title')
            ->get()
            ->sortBy(fn (QuizCategory $c) => $c->title === self::EXTRA_SUPPORT_TITLE ? 1 : 0)
            ->values();

        $map = [];
        // No predecessor before the very first quiz, so treat the gate as already satisfied.
        $previousCompleted = true;
        $nextAssigned = false;

        foreach ($categories as $category) {
            $group = $byCategory->get($category->id);
            if ($group === null) {
                continue;
            }

            foreach ($group as $quiz) {
                $attempted = $quiz->best_score !== null;

                if (! $quiz->is_premium) {
                    $lockReason = null;
                } elseif (! $isEntitled) {
                    $lockReason = 'premium';
                } elseif ($previousCompleted || $attempted) {
                    $lockReason = null;
                } else {
                    $lockReason = 'progress';
                }

                $isNext = false;
                if (! $nextAssigned && $lockReason === null && ! $attempted) {
                    $isNext = true;
                    $nextAssigned = true;
                }

                $map[$quiz->id] = ['lock_reason' => $lockReason, 'is_next' => $isNext];

                $previousCompleted = $attempted;
            }
        }

        return $map;
    }
}
