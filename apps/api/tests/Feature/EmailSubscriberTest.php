<?php

namespace Tests\Feature;

use App\Models\EmailSubscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailSubscriberTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_subscribe_with_email(): void
    {
        $response = $this->postJson('/api/v1/newsletter/subscribe', [
            'email' => 'Learner@Example.com',
            'state' => 'Alabama',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('email_subscribers', [
            'email' => 'learner@example.com',
            'state' => 'Alabama',
            'source' => 'home_hero',
            'unsubscribed_at' => null,
        ]);
    }

    public function test_subscribing_requires_a_valid_email(): void
    {
        $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrorFor('email');
    }

    public function test_resubscribing_reactivates_without_duplicating(): void
    {
        $existing = EmailSubscriber::factory()->create([
            'email' => 'learner@example.com',
            'state' => 'Alabama',
            'unsubscribed_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/newsletter/subscribe', [
            'email' => 'learner@example.com',
        ]);

        $response->assertOk();
        $this->assertSame(1, EmailSubscriber::query()->count());
        $existing->refresh();
        $this->assertNull($existing->unsubscribed_at);
        // A bare re-subscribe must not wipe the previously captured state.
        $this->assertSame('Alabama', $existing->state);
    }

    public function test_guest_cannot_list_subscribers(): void
    {
        $this->getJson('/api/v1/admin/email-subscribers')->assertUnauthorized();
    }

    public function test_non_admin_cannot_list_subscribers(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/email-subscribers')
            ->assertForbidden();
    }

    public function test_admin_can_list_and_filter_subscribers(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $active = EmailSubscriber::factory()->create(['email' => 'active@example.com', 'unsubscribed_at' => null]);
        $optedOut = EmailSubscriber::factory()->create(['email' => 'gone@example.com', 'unsubscribed_at' => now()]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/email-subscribers')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $filtered = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/email-subscribers?status=subscribed')
            ->assertOk();
        $ids = collect($filtered->json('data'))->pluck('id');
        $this->assertEquals([$active->id], $ids->all());

        $search = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/email-subscribers?search=gone')
            ->assertOk();
        $this->assertEquals([$optedOut->id], collect($search->json('data'))->pluck('id')->all());
    }

    public function test_admin_can_delete_a_subscriber(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $subscriber = EmailSubscriber::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/v1/admin/email-subscribers/'.$subscriber->id)
            ->assertOk();

        $this->assertDatabaseMissing('email_subscribers', ['id' => $subscriber->id]);
    }
}
