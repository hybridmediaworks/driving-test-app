<?php

namespace App\Enums;

use Laravel\Socialite\AbstractUser;

enum SocialProvider: string
{
    case Google = 'google';
    case Facebook = 'facebook';

    /**
     * Whether credentials are set in config/services.php. Unconfigured providers are rejected
     * before redirecting, so a button for a provider that isn't set up yet fails cleanly.
     */
    public function isConfigured(): bool
    {
        $config = config("services.{$this->value}", []);

        return filled($config['client_id'] ?? null) && filled($config['client_secret'] ?? null);
    }

    /**
     * The email the provider reports for this user, if any.
     */
    public function email(AbstractUser $user): ?string
    {
        $email = $user->getEmail();
        $email = is_string($email) ? mb_strtolower(trim($email)) : '';

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    /**
     * Whether the provider vouches that the user owns the reported email. Only a verified email may
     * be linked to an existing account or mark a new one verified — otherwise anyone able to put an
     * arbitrary address on their provider profile could sign in as the matching account.
     */
    public function verifiesEmail(AbstractUser $user): bool
    {
        return match ($this) {
            self::Google => filter_var($user->getRaw()['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN),
            self::Facebook => false,
        };
    }
}
