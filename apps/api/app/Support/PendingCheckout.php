<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * The plan a guest picked on /pricing before signing up, kept until they verify their email.
 *
 * The web client also keeps it in localStorage, but that only helps when the verification link is
 * opened in the same browser. A link opened anywhere else (another browser, the phone's mail app, a
 * Mailtrap inbox in a normal window while signing up in Incognito) used to land on the homepage, so
 * the server remembers it too and hands it back from the verify endpoint.
 */
final class PendingCheckout
{
    private const TTL_DAYS = 7;

    public static function remember(User $user, string $planKey): void
    {
        Cache::put(self::key($user), $planKey, now()->addDays(self::TTL_DAYS));
    }

    public static function get(User $user): ?string
    {
        return Cache::get(self::key($user));
    }

    public static function forget(User $user): void
    {
        Cache::forget(self::key($user));
    }

    private static function key(User $user): string
    {
        return "pending-checkout:{$user->getKey()}";
    }
}
