<?php

namespace Tests\Feature\Auth;

use App\Models\EmailSubscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_subscribe_rejects_disposable_email(): void
    {
        $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'someone@mailinator.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => self::MESSAGE]);

        $this->assertSame(0, EmailSubscriber::query()->count());
    }
}
