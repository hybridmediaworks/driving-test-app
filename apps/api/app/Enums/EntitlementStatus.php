<?php

namespace App\Enums;

enum EntitlementStatus: string
{
    case Active = 'active';
    case GracePeriod = 'grace_period';
    case Expired = 'expired';
}
