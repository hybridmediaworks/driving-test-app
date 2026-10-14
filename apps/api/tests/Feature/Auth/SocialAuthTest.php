<?php

namespace Tests\Feature\Auth;

use App\Enums\SocialProvider;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\FacebookProvider;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\Concerns\AuthenticatesWithBearerToken;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    use AuthenticatesWithBearerToken, RefreshDatabase;

    private const STATE = 'state-from-redirect';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.frontend_url' => 'http://frontend.test',
            'services.google' => ['client_id' => 'google-id', 'client_secret' => 'secret', 'redirect' => 'http://api.test/api/v1/auth/google/callback'],
            'services.facebook' => ['client_id' => 'facebook-id', 'client_secret' => 'secret', 'redirect' => 'http://api.test/api/v1/auth/facebook/callback'],
        ]);
    }

    /**
     * Make the provider return this identity from its code exchange.
     *
     * @param  array<string, mixed>  $raw
     */
    private function fakeIdentity(SocialProvider $provider, string $id, ?string $email, array $raw = [], ?string $name = 'Social User'): void
    {
        $identity = (new SocialiteUser)->setRaw($raw)->map(['id' => $id, 'email' => $email, 'name' => $name]);

        $driver = Mockery::mock(match ($provider) {
            SocialProvider::Google => GoogleProvider::class,
            SocialProvider::Facebook => FacebookProvider::class,
        });
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('fields')->andReturnSelf();
        $driver->shouldReceive('reRequest')->andReturnSelf();
        $driver->shouldReceive('user')->andReturn($identity);

        Socialite::shouldReceive('driver')->with($provider->value)->andReturn($driver);
    }

    private function fakeGoogle(string $id, string $email, bool $verified = true): void
    {
        $this->fakeIdentity(SocialProvider::Google, $id, $email, ['email_verified' => $verified]);
    }

    /**
     * @param  array<string, string>  $params
     */
    private function providerCallback(SocialProvider $provider, array $params = [], ?string $cookieState = self::STATE): TestResponse
    {
        if ($cookieState !== null) {
            $this->withUnencryptedCookie("oauth_state_{$provider->value}", Crypt::encryptString($cookieState));
        }

        $params += ['state' => self::STATE, 'code' => 'provider-code'];

        return $this->get("/api/v1/auth/{$provider->value}/callback?".http_build_query($params));
    }

    /**
     * @return array<string, string>
     */
    private function frontendQuery(TestResponse $response): array
    {
        $location = (string) $response->headers->get('Location');
        $this->assertStringStartsWith('http://frontend.test/auth/callback?', $location);

        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        return $query;
    }

    private function exchange(TestResponse $callback): TestResponse
    {
        return $this->postJson('/api/v1/auth/social/exchange', ['code' => $this->frontendQuery($callback)['code']]);
    }

    private function stateCookie(TestResponse $response, SocialProvider $provider): ?Cookie
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === "oauth_state_{$provider->value}") {
                return $cookie;
            }
        }

        return null;
    }

    public function test_redirect_sends_the_browser_to_the_provider_with_state_bound_to_a_cookie(): void
    {
        $response = $this->get('/api/v1/auth/google/redirect');

        $response->assertRedirect();
        $location = (string) $response->headers->get('Location');
        $this->assertStringStartsWith('https://accounts.google.com/', $location);

        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
        $cookie = $this->stateCookie($response, SocialProvider::Google);

        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame(Cookie::SAMESITE_LAX, $cookie->getSameSite());
        $this->assertSame($query['state'], Crypt::decryptString((string) $cookie->getValue()));
    }

    public function test_facebook_redirect_asks_only_for_email_and_re_asks_if_it_was_declined(): void
    {
        $response = $this->get('/api/v1/auth/facebook/redirect');

        $location = (string) $response->headers->get('Location');
        $this->assertStringStartsWith('https://www.facebook.com/', $location);

        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
        $this->assertSame('email', $query['scope']);
        $this->assertSame('rerequest', $query['auth_type']);
        $this->assertNotNull($this->stateCookie($response, SocialProvider::Facebook));
    }

    public function test_unconfigured_provider_bounces_back_as_unavailable(): void
    {
        config(['services.facebook.client_id' => null]);

        $response = $this->get('/api/v1/auth/facebook/redirect');

        $this->assertSame(['error' => 'unavailable'], $this->frontendQuery($response));
    }

    public function test_unknown_provider_is_not_found(): void
    {
        $this->get('/api/v1/auth/myspace/redirect')->assertNotFound();
    }

    public function test_callback_rejects_a_state_that_does_not_match_the_cookie(): void
    {
        $this->fakeGoogle('google-1', 'someone@gmail.com');

        $response = $this->providerCallback(SocialProvider::Google, cookieState: 'someone-elses-state');

        $this->assertSame(['error' => 'invalid_state'], $this->frontendQuery($response));
        $this->assertSame(0, User::query()->count());
    }

    public function test_callback_rejects_a_flow_started_in_another_browser(): void
    {
        $this->fakeGoogle('google-1', 'someone@gmail.com');

        $response = $this->providerCallback(SocialProvider::Google, cookieState: null);

        $this->assertSame(['error' => 'invalid_state'], $this->frontendQuery($response));
    }

    public function test_callback_reports_declined_consent_as_cancelled(): void
    {
        $response = $this->providerCallback(SocialProvider::Google, ['error' => 'access_denied']);

        $this->assertSame(['error' => 'cancelled'], $this->frontendQuery($response));
    }

    public function test_new_google_user_gets_a_verified_passwordless_account_and_a_token(): void
    {
        $this->fakeGoogle('google-1', 'New.Person@Gmail.com');

        $response = $this->exchange($this->providerCallback(SocialProvider::Google));

        $response->assertOk()
            ->assertJsonPath('user.email', 'new.person@gmail.com')
            ->assertJsonPath('user.name', 'Social User')
            ->assertJsonPath('user.has_password', false);
        $this->assertNotNull($response->json('user.email_verified_at'));

        $this->withHeader('Authorization', 'Bearer '.$response->json('token'))
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'new.person@gmail.com');

        $this->assertDatabaseHas('social_accounts', ['provider' => 'google', 'provider_user_id' => 'google-1']);
    }

    public function test_exchange_code_works_only_once(): void
    {
        $this->fakeGoogle('google-1', 'someone@gmail.com');
        $code = $this->frontendQuery($this->providerCallback(SocialProvider::Google))['code'];

        $this->postJson('/api/v1/auth/social/exchange', ['code' => $code])->assertOk();
        $this->postJson('/api/v1/auth/social/exchange', ['code' => $code])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_exchange_rejects_an_unknown_code(): void
    {
        $this->postJson('/api/v1/auth/social/exchange', ['code' => str_repeat('a', 64)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_returning_user_is_matched_by_provider_id_even_if_their_email_changed(): void
    {
        $user = User::factory()->create(['email' => 'old@gmail.com']);
        $user->socialAccounts()->create(['provider' => SocialProvider::Google, 'provider_user_id' => 'google-1']);
        $this->fakeGoogle('google-1', 'renamed@gmail.com');

        $this->exchange($this->providerCallback(SocialProvider::Google))->assertJsonPath('user.id', $user->id);

        $this->assertSame(1, User::query()->count());
    }

    public function test_verified_email_links_to_the_existing_account(): void
    {
        $user = User::factory()->create(['email' => 'someone@gmail.com', 'password' => Hash::make('password123')]);
        $this->fakeGoogle('google-1', 'someone@gmail.com');

        $this->exchange($this->providerCallback(SocialProvider::Google))
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.has_password', true);

        $this->assertSame(1, User::query()->count());
        $this->assertTrue($user->socialAccounts()->where('provider', 'google')->exists());
    }

    public function test_verified_email_reclaims_an_unverified_account_from_whoever_registered_it(): void
    {
        // Someone registered this address without owning it, then the real owner signs in.
        $squatter = User::factory()->unverified()->create(['email' => 'someone@gmail.com', 'password' => Hash::make('password123')]);
        $squatter->createToken('api');
        $squatter->socialAccounts()->create(['provider' => SocialProvider::Facebook, 'provider_user_id' => 'fb-squatter']);
        $this->fakeGoogle('google-1', 'someone@gmail.com');

        $this->exchange($this->providerCallback(SocialProvider::Google))->assertJsonPath('user.id', $squatter->id);

        $squatter->refresh();
        $this->assertFalse($squatter->hasPassword());
        $this->assertTrue($squatter->hasVerifiedEmail());
        $this->assertSame(1, $squatter->tokens()->count()); // only the one just issued
        $this->assertSame(['google'], $squatter->socialAccounts()->pluck('provider')->map->value->all());
    }

    public function test_unverified_email_never_links_to_an_existing_account(): void
    {
        User::factory()->create(['email' => 'someone@gmail.com']);
        $this->fakeIdentity(SocialProvider::Facebook, 'fb-1', 'someone@gmail.com');

        $response = $this->providerCallback(SocialProvider::Facebook);

        $this->assertSame(['error' => 'email_in_use'], $this->frontendQuery($response));
        $this->assertSame(0, SocialAccount::query()->count());
    }

    public function test_unverified_email_creates_an_unverified_account_that_must_verify(): void
    {
        Notification::fake();
        $this->fakeIdentity(SocialProvider::Facebook, 'fb-1', 'Person@Example.com');

        $response = $this->exchange($this->providerCallback(SocialProvider::Facebook));

        $response->assertOk()
            ->assertJsonPath('user.email', 'person@example.com')
            ->assertJsonPath('user.email_verified_at', null);
        Notification::assertSentTo(User::query()->sole(), VerifyEmail::class);
    }

    public function test_identity_without_an_email_is_rejected(): void
    {
        $this->fakeGoogle('google-1', '');

        $response = $this->providerCallback(SocialProvider::Google);

        $this->assertSame(['error' => 'email_missing'], $this->frontendQuery($response));
    }

    public function test_name_falls_back_to_the_email_when_the_provider_omits_it(): void
    {
        $this->fakeIdentity(SocialProvider::Facebook, 'fb-1', 'abc123@example.com', name: null);

        $this->exchange($this->providerCallback(SocialProvider::Facebook))
            ->assertOk()
            ->assertJsonPath('user.name', 'abc123');
    }

    public function test_google_email_marked_unverified_is_not_trusted_either(): void
    {
        User::factory()->create(['email' => 'someone@gmail.com']);
        $this->fakeGoogle('google-1', 'someone@gmail.com', verified: false);

        $response = $this->providerCallback(SocialProvider::Google);

        $this->assertSame(['error' => 'email_in_use'], $this->frontendQuery($response));
    }

    public function test_exchange_claims_the_guests_quiz_attempts(): void
    {
        $attempt = QuizAttempt::create([
            'quiz_id' => Quiz::factory()->create(['is_active' => true])->id,
            'user_id' => null,
            'guest_token' => 'guest-abc',
            'status' => 'completed',
            'score' => 80,
            'passed' => true,
            'correct_count' => 8,
            'total_questions' => 10,
            'started_at' => now(),
            'completed_at' => now(),
        ]);
        $this->fakeGoogle('google-1', 'someone@gmail.com');
        $code = $this->frontendQuery($this->providerCallback(SocialProvider::Google))['code'];

        $response = $this->withHeader('X-Guest-Token', 'guest-abc')
            ->postJson('/api/v1/auth/social/exchange', ['code' => $code]);

        $this->assertSame($response->json('user.id'), $attempt->refresh()->user_id);
        $this->assertNull($attempt->guest_token);
    }

    public function test_passwordless_user_can_set_a_first_password_without_a_current_one(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->withUserToken($user)->putJson('/api/v1/password', [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
    }

    public function test_user_with_a_password_still_needs_the_current_one_to_change_it(): void
    {
        $user = User::factory()->create();

        $this->withUserToken($user)->putJson('/api/v1/password', [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
    }

    public function test_passwordless_user_can_delete_their_account(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->withUserToken($user)->deleteJson('/api/v1/profile')->assertOk();

        $this->assertModelMissing($user);
    }
}
