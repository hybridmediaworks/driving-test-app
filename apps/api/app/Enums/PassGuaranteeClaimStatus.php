<?php

namespace App\Enums;

enum PassGuaranteeClaimStatus: string
{
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Denied = 'denied';
    case Refunded = 'refunded';
}
