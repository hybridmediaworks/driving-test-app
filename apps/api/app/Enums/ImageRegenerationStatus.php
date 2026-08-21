<?php

namespace App\Enums;

enum ImageRegenerationStatus: string
{
    case Pending = 'pending';
    case AwaitingReview = 'awaiting_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Failed = 'failed';
}
