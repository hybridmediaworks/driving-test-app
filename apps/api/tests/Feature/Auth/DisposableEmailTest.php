<?php

namespace Tests\Feature\Auth;

use App\Models\EmailSubscriber;
use App\Models\User;
use App\Support\DisposableEmail\DisposableDomainsFetcher;
use App\Support\DisposableEmail\DisposableMailServers;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Propaganistas\LaravelDisposableEmail\Facades\DisposableDomains;
use Tests\TestCase;

class DisposableEmailTest extends TestCase
{
    use RefreshDatabase;

    private const MESSAGE = 'Temporary email addresses are not allowed. Please use a valid, permanent email address.';

    private function register(string $email)
    {
        return $this->postJson('/api/v1/register', [
            'name' => 'New User',
            'email' => $email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function disposableEmails(): array
    {
        return [
            'mailinator' => ['someone@mailinator.com'],
            'mixed case' => ['Someone@MailInator.COM'],
            'random subdomain' => ['someone@x7f2.mailinator.com'],
        ];
    }

    #[DataProvider('disposableEmails')]
    public function test_register_rejects_disposable_email(string $email): void
    {
        $this->register($email)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => self::MESSAGE]);

        $this->assertSame(0, User::query()->count());
    }

    public function test_register_rejects_unlisted_domain_on_disposable_mail_server(): void
    {
        DisposableDomains::setMxResolver(fn () => [['type' => 'MX', 'target' => 'mail.mailinator.com.']]);

        $this->register('someone@brand-new-temp-domain.com')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => self::MESSAGE]);

        $this->assertSame(0, User::query()->count());
    }

    public function test_register_accepts_permanent_email(): void
    {
        $this->register('someone@gmail.com')->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'someone@gmail.com']);
    }

    private function fakeMailServers(array $knownIps, array $serversByDomain): void
    {
        DisposableDomains::setMxResolver(fn () => []);

        $mailServers = new DisposableMailServers(tempnam(sys_get_temp_dir(), 'disposable_mail_servers'));
        $mailServers->save($knownIps);
        $mailServers->setResolver(fn (string $domain): array => $serversByDomain[$domain] ?? []);

        $this->app->instance(DisposableMailServers::class, $mailServers);
    }

    public function test_register_rejects_unlisted_domain_sharing_a_disposable_mail_server_ip(): void
    {
        $this->fakeMailServers(['165.227.254.82'], [
            'brand-new-rotation.com' => ['mail.brand-new-rotation.com' => ['165.227.254.82']],
        ]);

        $this->register('someone@brand-new-rotation.com')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => self::MESSAGE]);

        $this->assertSame(0, User::query()->count());
    }

    public function test_register_accepts_domain_on_a_different_mail_server(): void
    {
        $this->fakeMailServers(['165.227.254.82'], [
            'company.com' => ['aspmx.l.google.com' => ['142.250.153.26']],
        ]);

        $this->register('someone@company.com')->assertCreated();
    }

    public function test_update_mail_servers_learns_only_ips_shared_by_several_disposable_domains(): void
    {
        $now = now()->getTimestamp();
        Http::fake(['raw.githubusercontent.com/*' => Http::response(['domains' => [
            'rot-a.com' => ['provider' => 'temp-mail.org', 'lastseen' => $now],
            'rot-b.com' => ['provider' => 'temp-mail.org', 'lastseen' => $now],
            'rot-c.com' => ['provider' => 'temp-mail.org', 'lastseen' => $now],
            'stale.com' => ['provider' => 'temp-mail.org', 'lastseen' => now()->subYear()->getTimestamp()],
            'on-gmail.com' => ['provider' => 'other', 'lastseen' => $now],
        ]])]);

        $this->fakeMailServers([], [
            'rot-a.com' => ['mail.rot-a.com' => ['165.227.254.82']],
            'rot-b.com' => ['mail.rot-b.com' => ['165.227.254.82']],
            'rot-c.com' => ['mail.rot-c.com' => ['165.227.254.82']],
            'stale.com' => ['mail.stale.com' => ['10.0.0.1']],
            'on-gmail.com' => ['aspmx.l.google.com' => ['142.250.153.26']],
        ]);

        $this->artisan('disposable:update-mail-servers')->assertSuccessful();

        $this->assertSame(['165.227.254.82'], $this->app->make(DisposableMailServers::class)->ips());
    }

    public function test_domains_fetcher_reads_plain_lists_and_fakefilter_format(): void
    {
        Http::fake([
            'list.test/*' => Http::response(['a.com', 'b.com']),
            'fakefilter.test/*' => Http::response(['domains' => ['c.com' => ['provider' => 'x'], 'd.com' => ['provider' => 'y']]]),
        ]);

        $fetcher = new DisposableDomainsFetcher;

        $this->assertSame(['a.com', 'b.com'], $fetcher->handle('https://list.test/domains.json'));
        $this->assertSame(['c.com', 'd.com'], $fetcher->handle('https://fakefilter.test/data.json'));
    }

    public function test_subscribe_rejects_disposable_email(): void
    {
        $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'someone@mailinator.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => self::MESSAGE]);

        $this->assertSame(0, EmailSubscriber::query()->count());
    }
}
