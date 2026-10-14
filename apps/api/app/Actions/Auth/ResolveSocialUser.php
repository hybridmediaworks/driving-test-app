<?php

namespace App\Actions\Auth;

use App\Enums\SocialAuthError;
use App\Enums\SocialProvider;
use App\Exceptions\SocialAuthException;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\AbstractUser;

class ResolveSocialUser
{
    public function __invoke(SocialProvider $provider, AbstractUser $identity): User
    {
        $providerUserId = (string) $identity->getId();

        $linked = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_user_id', $providerUserId)
            ->first();

        if ($linked !== null) {
            return $linked->user;
        }

        $email = $provider->email($identity);

        if ($email === null) {
            throw new SocialAuthException(SocialAuthError::EmailMissing);
        }

        $emailVerified = $provider->verifiesEmail($identity);

        $user = DB::transaction(function () use ($provider, $identity, $providerUserId, $email, $emailVerified): User {
            $user = User::query()->where('email', $email)->lockForUpdate()->first();

            if ($user === null) {
                $user = User::query()->forceCreate([
                    'name' => $this->displayName($identity, $email),
                    'email' => $email,
                    'email_verified_at' => $emailVerified ? now() : null,
                ]);
            } elseif (! $emailVerified) {
                throw new SocialAuthException(SocialAuthError::EmailInUse);
            } elseif (! $user->hasVerifiedEmail()) {
                $this->reclaimUnverifiedAccount($user);
            }

            $user->socialAccounts()->create([
                'provider' => $provider,
                'provider_user_id' => $providerUserId,
                'email' => $email,
            ]);

            return $user;
        });

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return $user;
    }

    private function reclaimUnverifiedAccount(User $user): void
    {
        $user->forceFill([
            'password' => null,
            'remember_token' => null,
            'email_verified_at' => now(),
        ])->save();

        $user->tokens()->delete();
        $user->socialAccounts()->delete();
    }

    /**
     * Providers may omit the name (or the user may decline to share it).
     */
    private function displayName(AbstractUser $identity, string $email): string
    {
        $name = trim(strip_tags((string) $identity->getName()));

        return Str::limit($name !== '' ? $name : Str::before($email, '@'), 255, '');
    }
}
