<?php

namespace App\Actions\Billing;

use App\Enums\FamilyInviteStatus;
use App\Models\FamilyMember;

class RevokeFamilyMember
{
    public function __invoke(FamilyMember $member): void
    {
        $member->update(['invite_status' => FamilyInviteStatus::Revoked]);
    }
}
