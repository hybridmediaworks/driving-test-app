<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmailVerificationGateTest extends TestCase
{
    use RefreshDatabase;

    public function test_unverified_user_is_forbidden_from_a_verified_gated_route(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/attempts');

        $response->assertForbidden();
    }

    public function test_verified_user_can_access_a_verified_gated_route(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/attempts');

        $response->assertOk();
    }

    public function test_unverified_user_can_still_view_their_own_profile(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/me');

        $response->assertOk();
    }

    public function test_unverified_user_can_still_resend_the_verification_email(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/email/verification-notification');

        $response->assertOk();
    }

    public function test_unverified_user_can_still_log_out(): void
    {
        $user = User::factory()->unverified()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/logout');

        $response->assertOk();
    }
}
