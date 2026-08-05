<?php

namespace App\Actions\Billing;

use App\Enums\FamilyInviteStatus;
use App\Models\FamilyMember;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ClaimFamilyInvite
{
    public function __invoke(User $user, string $token): FamilyMember
    {
        $member = FamilyMember::query()
            ->where('invite_token', $token)
            ->where('invite_status', FamilyInviteStatus::Pending)
            ->first();

        if ($member === null) {
            throw ValidationException::withMessages(['token' => __('This invite is invalid or has already been used.')]);
        }

        if ($user->familyMembership()->exists()) {
            throw ValidationException::withMessages(['token' => __('You already belong to a family plan.')]);
        }

        $member->update([
            'user_id' => $user->id,
            'invite_status' => FamilyInviteStatus::Claimed,
            'claimed_at' => now(),
        ]);

        return $member->fresh();
    }
}
