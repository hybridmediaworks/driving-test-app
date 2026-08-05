<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\PassGuarantee\IssueRefund;
use App\Actions\PassGuarantee\ReviewClaim;
use App\Enums\PassGuaranteeClaimStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ReviewPassGuaranteeClaimRequest;
use App\Http\Resources\Api\V1\PassGuaranteeClaimResource;
use App\Models\PassGuaranteeClaim;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PassGuaranteeClaimController extends Controller
{
    public function __construct(
        private readonly ReviewClaim $reviewClaim,
        private readonly IssueRefund $issueRefund,
    ) {}

    /**
     * List Pass Guarantee claims (admin)
     *
     * Requires an admin account. Optionally filter by `status`. Most recently submitted first.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = PassGuaranteeClaim::query()->with('user')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        return PassGuaranteeClaimResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Approve a claim (admin)
     */
    public function approve(ReviewPassGuaranteeClaimRequest $request, PassGuaranteeClaim $passGuaranteeClaim): JsonResponse
    {
        $claim = ($this->reviewClaim)(
            $passGuaranteeClaim,
            $request->user(),
            PassGuaranteeClaimStatus::Approved,
            $request->string('admin_notes')->toString() ?: null,
        );

        return response()->json(['claim' => new PassGuaranteeClaimResource($claim->load('user'))]);
    }

    /**
     * Deny a claim (admin)
     */
    public function deny(ReviewPassGuaranteeClaimRequest $request, PassGuaranteeClaim $passGuaranteeClaim): JsonResponse
    {
        $claim = ($this->reviewClaim)(
            $passGuaranteeClaim,
            $request->user(),
            PassGuaranteeClaimStatus::Denied,
            $request->string('admin_notes')->toString() ?: null,
        );

        return response()->json(['claim' => new PassGuaranteeClaimResource($claim->load('user'))]);
    }

    /**
     * Issue the refund for an approved claim (admin)
     *
     * A deliberately separate step from approval — the Stripe refund call can fail independently
     * (e.g. the underlying charge is already refunded elsewhere) and needs its own retry path
     * rather than being silently bundled into the approval decision.
     */
    public function refund(PassGuaranteeClaim $passGuaranteeClaim): JsonResponse
    {
        $claim = ($this->issueRefund)($passGuaranteeClaim);

        return response()->json(['claim' => new PassGuaranteeClaimResource($claim->load('user'))]);
    }
}
