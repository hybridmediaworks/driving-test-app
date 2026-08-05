<?php

namespace App\Actions\PassGuarantee;

use App\Enums\AttemptStatus;
use App\Enums\PassGuaranteeClaimStatus;
use App\Models\PassGuaranteeClaim;
use App\Models\Plan;
use App\Models\User;
use App\Services\Entitlement\EntitlementResolver;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitClaim
{
    public function __construct(
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * @param  list<UploadedFile>  $proofFiles
     */
    public function __invoke(User $user, ?string $proofNotes, ?string $examDate, array $proofFiles): PassGuaranteeClaim
    {
        $entitlement = $this->entitlement->resolve($user);

        if (! $entitlement->isPremium()) {
            throw ValidationException::withMessages(['plan' => __('You need an active paid plan to submit a Pass Guarantee claim.')]);
        }

        // Never trust client input for this — it's the whole point of the eligibility check.
        $completedPracticeAt = $user->quizAttempts()
            ->where('status', AttemptStatus::Completed)
            ->whereHas('quiz.quizType', fn ($query) => $query->where('name', 'final'))
            ->max('completed_at');

        if ($completedPracticeAt === null) {
            throw ValidationException::withMessages(['plan' => __('Complete at least one Exam Simulator attempt before submitting a claim.')]);
        }

        $hasOpenClaim = PassGuaranteeClaim::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [PassGuaranteeClaimStatus::Submitted, PassGuaranteeClaimStatus::UnderReview])
            ->exists();

        if ($hasOpenClaim) {
            throw ValidationException::withMessages(['plan' => __('You already have an open Pass Guarantee claim.')]);
        }

        $planId = null;

        if ($entitlement->familyGroupId === null) {
            $subscription = $user->subscription('default');
            $planId = $subscription === null
                ? null
                : Plan::query()->where('stripe_price_id', $subscription->stripe_price)->value('id');
        }

        return DB::transaction(function () use ($user, $planId, $entitlement, $completedPracticeAt, $examDate, $proofNotes, $proofFiles): PassGuaranteeClaim {
            $claim = PassGuaranteeClaim::query()->create([
                'user_id' => $user->id,
                'plan_id' => $planId,
                'family_group_id' => $entitlement->familyGroupId,
                'status' => PassGuaranteeClaimStatus::Submitted,
                'completed_practice_at' => $completedPracticeAt,
                'exam_date' => $examDate,
                'proof_notes' => $proofNotes,
            ]);

            foreach ($proofFiles as $file) {
                $claim->addMedia($file)->toMediaCollection(PassGuaranteeClaim::MEDIA_COLLECTION_PROOF);
            }

            return $claim;
        });
    }
}
