<?php

namespace App\Enums;

enum FamilyInviteStatus: string
{
    case Pending = 'pending';
    case Claimed = 'claimed';
    case Revoked = 'revoked';
}
