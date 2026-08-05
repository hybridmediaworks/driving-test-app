<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\PassGuarantee\SubmitClaim;
use App\Enums\AttemptStatus;
use App\Enums\PassGuaranteeClaimStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SubmitPassGuaranteeClaimRequest;
use App\Http\Resources\Api\V1\PassGuaranteeClaimResource;
use App\Models\PassGuaranteeClaim;
use App\Services\Entitlement\EntitlementResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PassGuaranteeClaimController extends Controller
{
    public function __construct(
        private readonly SubmitClaim $submitClaim,
        private readonly EntitlementResolver $entitlement,
    ) {}

    /**
     * Check my Pass Guarantee eligibility
     *
     * Requires authentication. A read-only preview of the same rule `store()` enforces server-side
     * — an active/family paid plan, plus at least one completed Exam Simulator attempt, and no
     * already-open claim — so the frontend can show why a claim can't be submitted yet before the
     * user fills out the form.
     */
    public function eligibility(Request $request): JsonResponse
    {
        $user = $request->user();
        $entitlement = $this->entitlement->resolve($user);

        if (! $entitlement->isPremium()) {
            return response()->json(['eligible' => false, 'reason' => __('You need an active paid plan to be eligible.')]);
        }

        $hasCompletedExam = $user->quizAttempts()
            ->where('status', AttemptStatus::Completed)
            ->whereHas('quiz.quizType', fn ($query) => $query->where('name', 'final'))
            ->exists();

        if (! $hasCompletedExam) {
            return response()->json(['eligible' => false, 'reason' => __('Complete at least one Exam Simulator attempt first.')]);
        }

        $hasOpenClaim = $user->passGuaranteeClaims()
            ->whereIn('status', [PassGuaranteeClaimStatus::Submitted, PassGuaranteeClaimStatus::UnderReview])
            ->exists();

        if ($hasOpenClaim) {
            return response()->json(['eligible' => false, 'reason' => __('You already have an open claim.')]);
        }

        return response()->json(['eligible' => true, 'reason' => null]);
    }

    /**
     * Submit a Pass Guarantee claim
     *
     * Requires authentication. Eligibility is re-verified server-side regardless of what
     * `eligibility()` last reported — never trust client state for something that authorizes a
     * refund.
     */
    public function store(SubmitPassGuaranteeClaimRequest $request): JsonResponse
    {
        $claim = ($this->submitClaim)(
            $request->user(),
            $request->string('proof_notes')->toString() ?: null,
            $request->string('exam_date')->toString() ?: null,
            $request->file('proof_files') ?? [],
        );

        return response()->json(['claim' => new PassGuaranteeClaimResource($claim)], 201);
    }

    /**
     * My Pass Guarantee claims
     *
     * Requires authentication. Own claims only, most recent first.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        return PassGuaranteeClaimResource::collection(
            $request->user()->passGuaranteeClaims()->latest()->get()
        );
    }
}
