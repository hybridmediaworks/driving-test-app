<?php

namespace App\Providers;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;

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
        // Our Subscription subclass exists solely to cast the app-owned `past_due_since` column
        // (see app/Models/Subscription.php) that stock Cashier's model doesn't know about.
        Cashier::useSubscriptionModel(Subscription::class);

        // NOTE: the Scramble docs are currently PUBLIC (RestrictedDocsAccess was removed from
        // config/scramble.php so the /docs/api Swagger UI opens on the live server in a plain
        // browser), so this gate is NOT consulted right now. It is kept so docs can be re-locked
        // by simply re-adding RestrictedDocsAccess to the Scramble middleware. It checks the
        // `sanctum` guard explicitly rather than Gate's auto-injected user because this app has no
        // session/cookie login (Sanctum token auth only), so the default guard never has an
        // authenticated user and a plain `fn (User $user)` signature would short-circuit to false.
        Gate::define('viewApiDocs', function (?User $user): bool {
            $sanctumUser = Auth::guard('sanctum')->user();

            return $sanctumUser !== null && $sanctumUser->is_admin;
        });

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
