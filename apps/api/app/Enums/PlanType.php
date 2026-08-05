<?php

namespace App\Enums;

enum PlanType: string
{
    case Recurring = 'recurring';
    case OneTime = 'one_time';
}
