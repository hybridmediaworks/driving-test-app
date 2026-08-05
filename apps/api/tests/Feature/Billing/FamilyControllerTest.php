<?php

namespace Tests\Feature\Billing;

use App\Mail\FamilyInviteMail;
use App\Models\FamilyGroup;
use App\Models\FamilyMember;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class FamilyControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeOwnedGroup(int $maxSeats = 3): array
    {
        $owner = User::factory()->create();
        $plan = Plan::query()->firstOrCreate(
            ['key' => 'lifetime_family'],
            ['name' => 'Lifetime Family', 'type' => 'one_time', 'price_cents' => 19900, 'max_seats' => $maxSeats],
        );
        $group = FamilyGroup::query()->create([
            'owner_user_id' => $owner->id,
            'plan_id' => $plan->id,
            'max_seats' => $maxSeats,
            'status' => 'active',
            'purchased_at' => now(),
        ]);
        FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        return [$owner, $group];
    }

    public function test_show_returns_null_for_a_user_with_no_family_plan(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/billing/family');

        $response->assertOk();
        $response->assertJson(['family_group' => null]);
    }

    public function test_show_returns_the_roster_for_the_owner(): void
    {
        [$owner, $group] = $this->makeOwnedGroup();

        $response = $this->actingAs($owner, 'sanctum')->getJson('/api/v1/billing/family');

        $response->assertOk();
        $response->assertJsonPath('family_group.id', $group->id);
        $this->assertCount(1, $response->json('family_group.members'));
    }

    public function test_invite_sends_an_email_and_creates_a_pending_seat(): void
    {
        Mail::fake();
        [$owner] = $this->makeOwnedGroup();

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/v1/billing/family/invite', [
            'email' => 'invitee@example.com',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('family_members', [
            'invited_email' => 'invitee@example.com',
            'invite_status' => 'pending',
        ]);
        Mail::assertSent(FamilyInviteMail::class);
    }

    public function test_invite_is_rejected_when_seats_are_full(): void
    {
        Mail::fake();
        [$owner, $group] = $this->makeOwnedGroup(maxSeats: 1);

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/v1/billing/family/invite', [
            'email' => 'invitee@example.com',
        ]);

        $response->assertUnprocessable();
        Mail::assertNothingSent();
    }

    public function test_invite_is_rejected_for_a_non_owner(): void
    {
        Mail::fake();
        [$owner, $group] = $this->makeOwnedGroup(maxSeats: 5);
        $member = User::factory()->create();
        FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $member->id,
            'role' => 'member',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        $response = $this->actingAs($member, 'sanctum')->postJson('/api/v1/billing/family/invite', [
            'email' => 'invitee@example.com',
        ]);

        $response->assertForbidden();
    }

    public function test_claim_activates_a_pending_seat(): void
    {
        [$owner, $group] = $this->makeOwnedGroup();
        $pendingMember = FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'invited_email' => 'invitee@example.com',
            'role' => 'member',
            'invite_token' => 'test-token-123',
            'invite_status' => 'pending',
            'invited_at' => now(),
        ]);
        $invitee = User::factory()->create(['email' => 'invitee@example.com']);

        $response = $this->actingAs($invitee, 'sanctum')->postJson('/api/v1/billing/family/claim', [
            'token' => 'test-token-123',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('family_members', [
            'id' => $pendingMember->id,
            'user_id' => $invitee->id,
            'invite_status' => 'claimed',
        ]);
    }

    public function test_claim_rejects_an_invalid_token(): void
    {
        $invitee = User::factory()->create();

        $response = $this->actingAs($invitee, 'sanctum')->postJson('/api/v1/billing/family/claim', [
            'token' => 'does-not-exist',
        ]);

        $response->assertUnprocessable();
    }

    public function test_claim_rejects_a_user_who_already_belongs_to_a_family(): void
    {
        [, $existingGroup] = $this->makeOwnedGroup();
        $invitee = User::factory()->create();
        FamilyMember::query()->create([
            'family_group_id' => $existingGroup->id,
            'user_id' => $invitee->id,
            'role' => 'member',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        [, $otherGroup] = $this->makeOwnedGroup();
        FamilyMember::query()->create([
            'family_group_id' => $otherGroup->id,
            'invited_email' => 'someone@example.com',
            'role' => 'member',
            'invite_token' => 'second-token',
            'invite_status' => 'pending',
            'invited_at' => now(),
        ]);

        $response = $this->actingAs($invitee, 'sanctum')->postJson('/api/v1/billing/family/claim', [
            'token' => 'second-token',
        ]);

        $response->assertUnprocessable();
    }

    public function test_owner_can_revoke_a_claimed_seat_and_it_stops_granting_access(): void
    {
        [$owner, $group] = $this->makeOwnedGroup();
        $member = User::factory()->create();
        $memberRow = FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $member->id,
            'role' => 'member',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        $response = $this->actingAs($owner, 'sanctum')->deleteJson("/api/v1/billing/family/members/{$memberRow->id}");

        $response->assertOk();
        $this->assertDatabaseHas('family_members', [
            'id' => $memberRow->id,
            'invite_status' => 'revoked',
        ]);
    }

    public function test_revoke_is_rejected_for_a_non_owner(): void
    {
        [$owner, $group] = $this->makeOwnedGroup(maxSeats: 5);
        $member = User::factory()->create();
        $memberRow = FamilyMember::query()->create([
            'family_group_id' => $group->id,
            'user_id' => $member->id,
            'role' => 'member',
            'invite_status' => 'claimed',
            'claimed_at' => now(),
        ]);

        $response = $this->actingAs($member, 'sanctum')->deleteJson("/api/v1/billing/family/members/{$memberRow->id}");

        $response->assertForbidden();
    }
}
