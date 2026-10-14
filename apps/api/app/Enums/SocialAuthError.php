<?php

namespace App\Enums;

enum SocialAuthError: string
{
    case Cancelled = 'cancelled';
    case InvalidState = 'invalid_state';
    case EmailMissing = 'email_missing';
    case EmailInUse = 'email_in_use';
    case Unavailable = 'unavailable';
    case Failed = 'failed';
}
