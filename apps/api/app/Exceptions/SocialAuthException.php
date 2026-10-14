<?php

namespace App\Exceptions;

use App\Enums\SocialAuthError;
use RuntimeException;

class SocialAuthException extends RuntimeException
{
    public function __construct(public readonly SocialAuthError $error)
    {
        parent::__construct("Social login failed: {$error->value}");
    }
}
