<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\ClaimGuestData;
use App\Actions\Auth\ResolveSocialUser;
use App\Enums\SocialAuthError;
use App\Enums\SocialProvider;
use App\Exceptions\SocialAuthException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\AbstractUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\FacebookProvider;
use Symfony\Component\HttpFoundation\Cookie;
use Throwable;

class SocialAuthController extends Controller
{
    private const STATE_TTL_SECONDS = 600;

    private const EXCHANGE_TTL_SECONDS = 60;

    public function __construct(
        private readonly ResolveSocialUser $resolveSocialUser,
        private readonly ClaimGuestData $claimGuestData,
    ) {}

    public function redirect(Request $request, SocialProvider $provider): RedirectResponse
    {
        if (! $provider->isConfigured()) {
            return $this->toFrontend(['error' => SocialAuthError::Unavailable->value]);
        }

        $state = Str::random(40);

        return $this->driver($provider)
            ->with(['state' => $state])
            ->redirect()
            ->withCookie($this->stateCookie($request, $provider, $state));
    }

    public function callback(Request $request, SocialProvider $provider): RedirectResponse
    {
        $forgetState = Cookie::create($this->stateCookieName($provider))->withExpires(1)->withPath($this->cookiePath());

        try {
            $user = $this->authenticate($request, $provider);
        } catch (SocialAuthException $e) {
            return $this->toFrontend(['error' => $e->error->value])->withCookie($forgetState);
        } catch (Throwable $e) {
            report($e);

            return $this->toFrontend(['error' => SocialAuthError::Failed->value])->withCookie($forgetState);
        }

        $code = Str::random(64);
        Cache::put($this->exchangeKey($code), $user->id, self::EXCHANGE_TTL_SECONDS);

        return $this->toFrontend(['code' => $code])->withCookie($forgetState);
    }

    public function exchange(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'size:64']]);

        $userId = Cache::pull($this->exchangeKey($data['code']));
        $user = $userId !== null ? User::query()->find($userId) : null;

        if ($user === null) {
            throw ValidationException::withMessages([
                'code' => __('This sign-in link is invalid or has expired. Please try again.'),
            ]);
        }

        ($this->claimGuestData)($user, $request->header('X-Guest-Token') ?: $request->input('guest_token'));

        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['user' => new UserResource($user), 'token' => $token]);
    }

    /**
     * @throws SocialAuthException
     */
    private function authenticate(Request $request, SocialProvider $provider): User
    {
        if ($request->filled('error')) {
            throw new SocialAuthException(SocialAuthError::Cancelled);
        }

        if (! $provider->isConfigured()) {
            throw new SocialAuthException(SocialAuthError::Unavailable);
        }

        if (! $this->hasValidState($request, $provider)) {
            throw new SocialAuthException(SocialAuthError::InvalidState);
        }

        try {
            /** @var AbstractUser $identity */
            $identity = $this->driver($provider)->user();
        } catch (Throwable $e) {
            Log::warning('Social login: provider exchange failed', [
                'provider' => $provider->value,
                'exception' => $e->getMessage(),
            ]);

            throw new SocialAuthException(SocialAuthError::Failed);
        }

        return ($this->resolveSocialUser)($provider, $identity);
    }

    private function driver(SocialProvider $provider): AbstractProvider
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider->value);
        $driver->stateless();

        if ($driver instanceof FacebookProvider) {
            $driver->fields(['name', 'email'])->reRequest();
        }

        return $driver;
    }

    private function hasValidState(Request $request, SocialProvider $provider): bool
    {
        $cookie = $request->cookie($this->stateCookieName($provider));
        $state = $request->input('state');

        if (! is_string($cookie) || ! is_string($state) || $state === '') {
            return false;
        }

        try {
            return hash_equals(Crypt::decryptString($cookie), $state);
        } catch (DecryptException) {
            return false;
        }
    }

    private function stateCookie(Request $request, SocialProvider $provider, string $state): Cookie
    {
        return Cookie::create($this->stateCookieName($provider))
            ->withValue(Crypt::encryptString($state))
            ->withExpires(time() + self::STATE_TTL_SECONDS)
            ->withPath($this->cookiePath())
            ->withSecure($request->isSecure())
            ->withHttpOnly(true)
            ->withSameSite(Cookie::SAMESITE_LAX);
    }

    private function stateCookieName(SocialProvider $provider): string
    {
        return "oauth_state_{$provider->value}";
    }

    private function cookiePath(): string
    {
        return '/api/v1/auth';
    }

    private function exchangeKey(string $code): string
    {
        return 'social-login:'.hash('sha256', $code);
    }

    /**
     * @param  array<string, string>  $query
     */
    private function toFrontend(array $query): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return redirect()->away("{$frontendUrl}/auth/callback?".http_build_query($query));
    }
}
