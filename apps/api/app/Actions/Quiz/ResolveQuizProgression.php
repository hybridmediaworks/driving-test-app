<?php

namespace App\Actions\Quiz;

use App\Enums\AttemptStatus;
use App\Enums\Feature;
use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;

/**
 * Server-side source of truth for the ladder's lock state, so every client (web and mobile)
 * renders the same thing instead of each re-deriving it.
 *
 * Paying for the content is the only gate. The ladder used to also run a progressive "finish one
 * to unlock the next" chain on top of that, which meant a subscriber who had just paid still saw
 * most of the ladder locked — so the chain was dropped and a subscription now opens everything at
 * once. The order below is still what the page reads as a path; it just isn't enforced.
 *
 * Walks the ladder in the exact order it is displayed — categories by order_no/title with
 * "The extra support" always last, quizzes within a category by is_premium/order_no/title — and
 * for each quiz decides:
 *   - lock_reason "premium": premium content the viewer hasn't paid for → the card should route
 *     to pricing.
 *   - lock_reason null: open (free content, or anyone entitled — which includes admins, via the
 *     QA bypass in Entitlement::isPremium).
 *   - is_next: the single first open, not-yet-completed quiz — the one to take now.
 *
 * "Completed" means any completed attempt (score-agnostic), matching the pass line used elsewhere.
 */
class ResolveQuizProgression
{
    private const EXTRA_SUPPORT_TITLE = 'The extra support';

    /**
     * CDL's main program. Its other categories are optional endorsements a driver picks per job, so
     * the hub numbers this one and lists the rest under "Optional endorsements" — see
     * CDL_MAIN_PROGRAM_TITLE in apps/web/lib/stateHubSections.ts, which must name the same category.
     */
    private const CDL_MAIN_PROGRAM_TITLE = 'Hazardous Materials (HazMat)';

    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * @return array<int, array{lock_reason: 'premium'|null, is_next: bool}>
     */
    public function __invoke(string $stateCode, string $vehicleType, string $testTrack, ?User $user, ?string $guestToken = null): array
    {
        // Admins count as entitled too (the QA bypass in Entitlement::isPremium), so they get the
        // same open ladder without a rule of their own.
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

        // Display order: order_no/title, then re-ranked into the order the page actually reads in,
        // so "next" lands on the card the learner sees first. "The extra support" is always the last
        // rung; for CDL the main program comes before the optional endorsements, which would
        // otherwise win on order_no alone (General Knowledge is 0, HazMat is 1) and put "Next" in a
        // section the learner hasn't been sent to yet.
        $isCdl = strcasecmp($vehicleType, 'cdl') === 0;

        $categories = QuizCategory::query()
            ->where('is_active', true)
            ->orderBy('order_no')
            ->orderBy('title')
            ->get()
            ->sortBy(function (QuizCategory $c) use ($isCdl): int {
                if ($isCdl && $c->title === self::CDL_MAIN_PROGRAM_TITLE) {
                    return 0;
                }
                if ($c->title === self::EXTRA_SUPPORT_TITLE) {
                    return $isCdl ? 1 : 2;
                }

                return $isCdl ? 2 : 1;
            })
            ->values();

        $map = [];
        $nextAssigned = false;

        foreach ($categories as $category) {
            $group = $byCategory->get($category->id);
            if ($group === null) {
                continue;
            }

            foreach ($group as $quiz) {
                $attempted = $quiz->best_score !== null;
                $lockReason = $quiz->is_premium && ! $isEntitled ? 'premium' : null;

                $isNext = false;
                if (! $nextAssigned && $lockReason === null && ! $attempted) {
                    $isNext = true;
                    $nextAssigned = true;
                }

                $map[$quiz->id] = ['lock_reason' => $lockReason, 'is_next' => $isNext];
            }
        }

        return $map;
    }
}
