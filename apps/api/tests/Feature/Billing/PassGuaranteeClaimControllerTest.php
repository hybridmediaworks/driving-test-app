<?php

namespace Tests\Feature\Billing;

use App\Enums\AttemptStatus;
use App\Models\PassGuaranteeClaim;
use App\Models\Plan;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizType;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class PassGuaranteeClaimControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makePremiumUser(): User
    {
        Plan::query()->firstOrCreate(
            ['key' => 'monthly'],
            ['name' => 'Monthly', 'type' => 'recurring', 'billing_interval' => 'month', 'price_cents' => 7500, 'stripe_price_id' => 'price_pg_test'],
        );
        $user = User::factory()->create();
        Subscription::query()->create([
            'user_id' => $user->id,
            'type' => 'default',
            'stripe_id' => 'sub_pg_'.$user->id,
            'stripe_status' => 'active',
            'stripe_price' => 'price_pg_test',
            'quantity' => 1,
        ]);

        return $user;
    }

    private function completeExamSimulation(User $user): void
    {
        $examType = QuizType::query()->firstOrCreate(['name' => 'final'], ['title' => 'Final Exam Simulation']);
        $examQuiz = Quiz::factory()->create(['quiz_type_id' => $examType->id]);

        QuizAttempt::query()->create([
            'user_id' => $user->id,
            'quiz_id' => $examQuiz->id,
            'status' => AttemptStatus::Completed,
            'score' => 90,
            'passed' => true,
            'correct_count' => 9,
            'total_questions' => 10,
            'started_at' => now()->subMinutes(20),
            'completed_at' => now(),
            'duration_seconds' => 1200,
        ]);
    }

    public function test_eligibility_is_false_without_a_paid_plan(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/pass-guarantee/eligibility');

        $response->assertOk();
        $response->assertJson(['eligible' => false]);
    }

    public function test_eligibility_is_false_without_a_completed_exam_simulation(): void
    {
        $user = $this->makePremiumUser();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/pass-guarantee/eligibility');

        $response->assertOk();
        $response->assertJson(['eligible' => false]);
    }

    public function test_eligibility_is_true_for_a_premium_user_with_a_completed_exam(): void
    {
        $user = $this->makePremiumUser();
        $this->completeExamSimulation($user);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/pass-guarantee/eligibility');

        $response->assertOk();
        $response->assertJson(['eligible' => true, 'reason' => null]);
    }

    public function test_store_creates_a_claim_with_proof_files(): void
    {
        $user = $this->makePremiumUser();
        $this->completeExamSimulation($user);

        $response = $this->actingAs($user, 'sanctum')->post('/api/v1/pass-guarantee/claims', [
            'proof_notes' => 'Failed the DMV test despite practicing.',
            'proof_files' => [UploadedFile::fake()->image('proof.jpg')],
        ], ['Accept' => 'application/json']);

        $response->assertCreated();
        $this->assertDatabaseHas('pass_guarantee_claims', [
            'user_id' => $user->id,
            'status' => 'submitted',
            'proof_notes' => 'Failed the DMV test despite practicing.',
        ]);
        $claim = PassGuaranteeClaim::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertCount(1, $claim->getMedia(PassGuaranteeClaim::MEDIA_COLLECTION_PROOF));
        $this->assertNotNull($claim->completed_practice_at);
    }

    public function test_store_is_rejected_when_not_actually_eligible(): void
    {
        $user = $this->makePremiumUser();
        // No completed exam simulation — server-side re-check must catch this even if the client
        // skipped calling eligibility() first.

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/pass-guarantee/claims', [
            'proof_notes' => 'I definitely practiced, trust me.',
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseCount('pass_guarantee_claims', 0);
    }

    public function test_store_is_rejected_when_an_open_claim_already_exists(): void
    {
        $user = $this->makePremiumUser();
        $this->completeExamSimulation($user);

        $first = $this->actingAs($user, 'sanctum')->postJson('/api/v1/pass-guarantee/claims', ['proof_notes' => 'First claim']);
        $first->assertCreated();

        $second = $this->actingAs($user, 'sanctum')->postJson('/api/v1/pass-guarantee/claims', ['proof_notes' => 'Second claim']);
        $second->assertUnprocessable();
        $this->assertDatabaseCount('pass_guarantee_claims', 1);
    }

    public function test_index_returns_only_my_own_claims(): void
    {
        $user = $this->makePremiumUser();
        $this->completeExamSimulation($user);
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/pass-guarantee/claims', ['proof_notes' => 'Mine']);

        $otherUser = $this->makePremiumUser();
        $this->completeExamSimulation($otherUser);
        $this->actingAs($otherUser, 'sanctum')->postJson('/api/v1/pass-guarantee/claims', ['proof_notes' => 'Not mine']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/pass-guarantee/claims');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $response->assertJsonPath('data.0.proof_notes', 'Mine');
    }
}
