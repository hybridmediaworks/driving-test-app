<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Billing\ClaimFamilyInvite;
use App\Actions\Billing\InviteFamilyMember;
use App\Actions\Billing\RevokeFamilyMember;
use App\Enums\FamilyInviteStatus;
use App\Enums\FamilyMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ClaimFamilyInviteRequest;
use App\Http\Requests\Api\V1\InviteFamilyMemberRequest;
use App\Http\Resources\Api\V1\FamilyGroupResource;
use App\Http\Resources\Api\V1\FamilyMemberResource;
use App\Models\FamilyGroup;
use App\Models\FamilyMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyController extends Controller
{
    public function __construct(
        private readonly InviteFamilyMember $invite,
        private readonly ClaimFamilyInvite $claim,
        private readonly RevokeFamilyMember $revokeMember,
    ) {}

    /**
     * My family plan
     *
     * Requires authentication. Returns the Lifetime-Family group the user belongs to — as owner
     * or seat member, both are represented identically via a `family_members` row — or `null` if
     * they're not on one. Owners see the full seat roster; members see the same shape (useful for
     * "who else is on this plan" transparency, nothing sensitive is exposed beyond name/email).
     */
    public function show(Request $request): JsonResponse
    {
        $membership = $request->user()->familyMembership()->with('familyGroup.members.user')->first();

        if ($membership === null || $membership->invite_status !== FamilyInviteStatus::Claimed || $membership->familyGroup === null) {
            return response()->json(['family_group' => null]);
        }

        return response()->json(['family_group' => new FamilyGroupResource($membership->familyGroup)]);
    }

    /**
     * Invite a seat
     *
     * Requires authentication and Lifetime-Family ownership. Blocked once the plan's seats are
     * full, if the email already has a pending or claimed seat, or for the owner's own email.
     */
    public function invite(InviteFamilyMemberRequest $request): JsonResponse
    {
        $group = $this->ownedGroupOrFail($request->user());

        $member = ($this->invite)($group, $request->string('email')->toString());

        return response()->json(['member' => new FamilyMemberResource($member)], 201);
    }

    /**
     * Claim an invite
     *
     * Requires authentication (the invitee must register/log in first, then claim). Fails if the
     * token is invalid/already used, or if the authenticated user already belongs to a family plan.
     */
    public function claim(ClaimFamilyInviteRequest $request): JsonResponse
    {
        $member = ($this->claim)($request->user(), $request->string('token')->toString());

        return response()->json(['member' => new FamilyMemberResource($member->load('user'))]);
    }

    /**
     * Revoke a seat
     *
     * Requires authentication and Lifetime-Family ownership. Works on both a still-pending invite
     * and an already-claimed member — revoking a claimed member cuts their access immediately,
     * since EntitlementResolver only grants family access to `claimed` seats.
     */
    public function revoke(Request $request, FamilyMember $member): JsonResponse
    {
        $group = $this->ownedGroupOrFail($request->user());

        abort_unless($member->family_group_id === $group->id, 403);

        ($this->revokeMember)($member);

        return response()->json(['message' => __('Seat revoked.')]);
    }

    private function ownedGroupOrFail(User $user): FamilyGroup
    {
        $membership = $user->familyMembership()->with('familyGroup')->first();

        abort_unless(
            $membership !== null
                && $membership->role === FamilyMemberRole::Owner
                && $membership->familyGroup !== null,
            403,
        );

        return $membership->familyGroup;
    }
}
