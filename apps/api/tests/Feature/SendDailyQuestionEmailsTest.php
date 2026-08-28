<?php

namespace Tests\Feature;

use App\Mail\DailyQuestionMail;
use App\Models\EmailSubscriber;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendDailyQuestionEmailsTest extends TestCase
{
    use RefreshDatabase;

    private function makeEligibleQuiz(State $state, string $vehicleTypeName = 'car'): Quiz
    {
        $vehicleType = VehicleType::query()->firstOrCreate(
            ['name' => $vehicleTypeName],
            ['title' => ucfirst($vehicleTypeName), 'is_active' => true],
        );

        $quiz = Quiz::factory()->create([
            'state_id' => $state->id,
            'vehicle_type_id' => $vehicleType->id,
            'is_active' => true,
            'is_premium' => false,
            'test_track' => 'permit_test',
        ]);

        $question = QuizQuestion::factory()->create(['quiz_id' => $quiz->id]);
        QuizAnswer::factory()->correct()->create(['quiz_question_id' => $question->id]);
        QuizAnswer::factory()->create(['quiz_question_id' => $question->id]);

        return $quiz;
    }

    public function test_it_queues_a_question_for_an_eligible_subscriber(): void
    {
        Mail::fake();
        $state = State::factory()->create(['name' => 'Alabama']);
        $this->makeEligibleQuiz($state, 'car');
        $subscriber = EmailSubscriber::factory()->create([
            'state' => 'Alabama',
            'vehicle_type' => 'car',
            'unsubscribed_at' => null,
            'last_sent_at' => null,
        ]);

        $this->artisan('newsletter:send-daily-questions')->assertSuccessful();

        Mail::assertQueued(DailyQuestionMail::class, fn (DailyQuestionMail $mail) => $mail->hasTo($subscriber->email));
        $this->assertNotNull($subscriber->fresh()->last_sent_at);
    }

    public function test_it_skips_a_subscriber_with_no_matching_state(): void
    {
        Mail::fake();
        $subscriber = EmailSubscriber::factory()->create(['state' => null, 'last_sent_at' => null]);

        $this->artisan('newsletter:send-daily-questions')->assertSuccessful();

        Mail::assertNothingQueued();
        $this->assertNull($subscriber->fresh()->last_sent_at);
    }

    public function test_it_skips_a_subscriber_with_no_eligible_quiz(): void
    {
        Mail::fake();
        State::factory()->create(['name' => 'Alabama']);
        $subscriber = EmailSubscriber::factory()->create([
            'state' => 'Alabama',
            'last_sent_at' => null,
        ]);

        $this->artisan('newsletter:send-daily-questions')->assertSuccessful();

        Mail::assertNothingQueued();
        $this->assertNull($subscriber->fresh()->last_sent_at);
    }

    public function test_it_does_not_resend_the_same_day(): void
    {
        Mail::fake();
        $state = State::factory()->create(['name' => 'Alabama']);
        $this->makeEligibleQuiz($state, 'car');
        EmailSubscriber::factory()->create([
            'state' => 'Alabama',
            'vehicle_type' => 'car',
            'last_sent_at' => now(),
        ]);

        $this->artisan('newsletter:send-daily-questions')->assertSuccessful();

        Mail::assertNothingQueued();
    }

    public function test_it_resends_the_next_day(): void
    {
        Mail::fake();
        $state = State::factory()->create(['name' => 'Alabama']);
        $this->makeEligibleQuiz($state, 'car');
        $subscriber = EmailSubscriber::factory()->create([
            'state' => 'Alabama',
            'vehicle_type' => 'car',
            'last_sent_at' => now()->subDay(),
        ]);

        $this->artisan('newsletter:send-daily-questions')->assertSuccessful();

        Mail::assertQueued(DailyQuestionMail::class, fn (DailyQuestionMail $mail) => $mail->hasTo($subscriber->email));
    }

    public function test_it_skips_unsubscribed_subscribers(): void
    {
        Mail::fake();
        $state = State::factory()->create(['name' => 'Alabama']);
        $this->makeEligibleQuiz($state, 'car');
        EmailSubscriber::factory()->create([
            'state' => 'Alabama',
            'vehicle_type' => 'car',
            'last_sent_at' => null,
            'unsubscribed_at' => now(),
        ]);

        $this->artisan('newsletter:send-daily-questions')->assertSuccessful();

        Mail::assertNothingQueued();
    }

    public function test_one_failing_subscriber_does_not_abort_the_batch(): void
    {
        Mail::fake();
        $state = State::factory()->create(['name' => 'Alabama']);
        $this->makeEligibleQuiz($state, 'car');

        // No matching state — resolves to null and is skipped, but must not stop the next row.
        EmailSubscriber::factory()->create(['state' => 'Nowhere', 'last_sent_at' => null]);
        $eligible = EmailSubscriber::factory()->create([
            'state' => 'Alabama',
            'vehicle_type' => 'car',
            'last_sent_at' => null,
        ]);

        $this->artisan('newsletter:send-daily-questions')->assertSuccessful();

        Mail::assertQueued(DailyQuestionMail::class, fn (DailyQuestionMail $mail) => $mail->hasTo($eligible->email));
    }
}
