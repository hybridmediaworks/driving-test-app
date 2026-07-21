<?php

namespace Tests\Feature\Admin;

use App\Actions\PassGuarantee\IssueRefund;
use App\Mail\PassGuaranteeClaimDecidedMail;
use App\Models\PassGuaranteeClaim;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PassGuaranteeClaimAdminTest extends TestCase
{
    use RefreshDatabase;

    private function makeSubmittedClaim(): PassGuaranteeClaim
    {
        $user = User::factory()->create();

        return PassGuaranteeClaim::query()->create([
            'user_id' => $user->id,
            'status' => 'submitted',
            'completed_practice_at' => now(),
            'proof_notes' => 'Please review.',
        ]);
    }

    public function test_index_requires_admin(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $this->makeSubmittedClaim();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/pass-guarantee-claims');

        $response->assertForbidden();
    }

    public function test_index_filters_by_status(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $submitted = $this->makeSubmittedClaim();
        $approved = $this->makeSubmittedClaim();
        $approved->update(['status' => 'approved']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/pass-guarantee-claims?status=submitted');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($submitted->id));
        $this->assertFalse($ids->contains($approved->id));
    }

    public function test_approve_transitions_the_claim_and_sends_an_email(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['is_admin' => true]);
        $claim = $this->makeSubmittedClaim();

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/pass-guarantee-claims/{$claim->id}/approve", [
            'admin_notes' => 'Looks legitimate.',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('pass_guarantee_claims', [
            'id' => $claim->id,
            'status' => 'approved',
            'admin_user_id' => $admin->id,
            'admin_notes' => 'Looks legitimate.',
        ]);
        Mail::assertSent(PassGuaranteeClaimDecidedMail::class);
    }

    public function test_deny_transitions_the_claim(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['is_admin' => true]);
        $claim = $this->makeSubmittedClaim();

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/pass-guarantee-claims/{$claim->id}/deny", [
            'admin_notes' => 'Not enough practice evidence.',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('pass_guarantee_claims', ['id' => $claim->id, 'status' => 'denied']);
    }

    public function test_approving_an_already_decided_claim_is_rejected(): void
    {
        Mail::fake();
        $admin = User::factory()->create(['is_admin' => true]);
        $claim = $this->makeSubmittedClaim();
        $claim->update(['status' => 'denied']);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/pass-guarantee-claims/{$claim->id}/approve");

        $response->assertUnprocessable();
    }

    public function test_refund_delegates_to_the_issue_refund_action(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $claim = $this->makeSubmittedClaim();
        $claim->update(['status' => 'approved']);

        // IssueRefund genuinely calls Stripe's refunds API — swap in a fake so this test proves
        // the controller's plumbing without a network call, matching CreateCheckoutSession's
        // treatment in BillingControllerTest.
        $this->app->instance(IssueRefund::class, new class extends IssueRefund
        {
            public function __invoke(PassGuaranteeClaim $claim): PassGuaranteeClaim
            {
                $claim->update([
                    'status' => 'refunded',
                    'refunded_at' => now(),
                    'stripe_refund_id' => 'rf_fake_123',
                    'refund_amount_cents' => 7500,
                ]);

                return $claim->fresh();
            }
        });

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/pass-guarantee-claims/{$claim->id}/refund");

        $response->assertOk();
        $response->assertJsonPath('claim.status', 'refunded');
        $this->assertDatabaseHas('pass_guarantee_claims', [
            'id' => $claim->id,
            'status' => 'refunded',
            'stripe_refund_id' => 'rf_fake_123',
        ]);
    }
}
