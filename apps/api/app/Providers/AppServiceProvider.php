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

        // Gates the /docs/api Swagger UI in any non-local environment (RestrictedDocsAccess
        // middleware falls back to this once APP_ENV isn't 'local'). Admins only — the docs
        // expose the full endpoint map, including admin routes, which is real recon value for
        // an attacker even though the endpoints themselves still require their own auth.
        //
        // Checks the `sanctum` guard explicitly rather than relying on Gate's auto-injected
        // user: this app has no session/cookie login (Sanctum token auth only), so the default
        // guard never has an authenticated user and a plain `fn (User $user)` signature would
        // always short-circuit to false before this closure even runs.
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
