<?php

namespace App\Actions\Billing;

use App\Enums\FamilyInviteStatus;
use App\Mail\FamilyInviteMail;
use App\Models\FamilyGroup;
use App\Models\FamilyMember;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InviteFamilyMember
{
    public function __invoke(FamilyGroup $group, string $email): FamilyMember
    {
        if ($group->members()->count() >= $group->max_seats) {
            throw ValidationException::withMessages(['email' => __('This family plan has no open seats left.')]);
        }

        if ($group->owner->email === $email) {
            throw ValidationException::withMessages(['email' => __('You already have a seat on this plan.')]);
        }

        $alreadyInvited = $group->members()
            ->where('invited_email', $email)
            ->whereIn('invite_status', [FamilyInviteStatus::Pending, FamilyInviteStatus::Claimed])
            ->exists();

        if ($alreadyInvited) {
            throw ValidationException::withMessages(['email' => __('This person already has a pending or active seat.')]);
        }

        $member = $group->members()->create([
            'role' => 'member',
            'invited_email' => $email,
            'invite_token' => Str::random(40),
            'invite_status' => 'pending',
            'invited_at' => now(),
        ]);

        Mail::to($email)->send(new FamilyInviteMail($member));

        return $member;
    }
}
