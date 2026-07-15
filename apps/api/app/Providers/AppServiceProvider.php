<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        VerifyEmail::createUrlUsing(function (User $user) use ($frontendUrl): string {
            $signedApiUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())]
            );

            $query = parse_url($signedApiUrl, PHP_URL_QUERY);

            return "{$frontendUrl}/verify-email/{$user->getKey()}/".sha1($user->getEmailForVerification())."?{$query}";
        });

        ResetPassword::createUrlUsing(function (User $user, string $token) use ($frontendUrl): string {
            return "{$frontendUrl}/reset-password/{$token}?email=".urlencode($user->getEmailForPasswordReset());
        });
    }
}
