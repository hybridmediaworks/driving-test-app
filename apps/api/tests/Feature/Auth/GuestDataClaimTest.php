<?php

namespace Tests\Feature\Auth;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class GuestDataClaimTest extends TestCase
{
    use RefreshDatabase;

    private function guestAttempt(string $token): QuizAttempt
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);

        return QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => null,
            'guest_token' => $token,
            'status' => 'completed',
            'score' => 80,
            'passed' => true,
            'correct_count' => 8,
            'total_questions' => 10,
            'started_at' => now(),
            'completed_at' => now(),
        ]);
    }

    public function test_register_claims_matching_guest_attempts(): void
    {
        $attempt = $this->guestAttempt('guest-abc');

        $res = $this->withHeader('X-Guest-Token', 'guest-abc')->postJson('/api/v1/register', [
            'name' => 'New User',
            'email' => 'new@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $res->assertCreated();
        $attempt->refresh();

        $this->assertSame($res->json('user.id'), $attempt->user_id);
        $this->assertNull($attempt->guest_token);
    }

    public function test_login_claims_matching_guest_attempts(): void
    {
        $user = User::factory()->create(['password' => Hash::make('password123')]);
        $attempt = $this->guestAttempt('guest-xyz');

        $this->withHeader('X-Guest-Token', 'guest-xyz')->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $attempt->refresh();

        $this->assertSame($user->id, $attempt->user_id);
        $this->assertNull($attempt->guest_token);
    }

    public function test_another_guests_attempts_are_left_untouched(): void
    {
        $other = $this->guestAttempt('someone-else');

        $this->withHeader('X-Guest-Token', 'guest-abc')->postJson('/api/v1/register', [
            'name' => 'A',
            'email' => 'a@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $other->refresh();

        // A different guest's attempts must not be swept into the new account.
        $this->assertNull($other->user_id);
        $this->assertSame('someone-else', $other->guest_token);
    }
}
