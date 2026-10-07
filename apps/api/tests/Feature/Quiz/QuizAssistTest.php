<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuizAssistTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{quiz: Quiz, question: QuizQuestion}
     */
    private function makeQuestion(): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->create();

        return compact('quiz', 'question');
    }

    private function fakeGrok(string $reply = 'Think about what a yellow diamond warns you about.'): void
    {
        config([
            'services.grok.key' => 'test-key',
            'services.grok.model' => 'llama-3.3-70b-versatile',
            'services.grok.base_url' => 'https://api.groq.com/openai/v1',
        ]);
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['role' => 'assistant', 'content' => $reply]]],
            ]),
        ]);
    }

    public function test_hint_mode_returns_a_reply(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok('Consider what the shape of the sign implies.');

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'hint',
        ]);

        $response->assertOk();
        $response->assertJsonPath('reply', 'Consider what the shape of the sign implies.');
    }

    public function test_ask_mode_requires_a_message(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['message']);
    }

    public function test_invalid_mode_is_rejected(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'explain',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['mode']);
    }

    public function test_returns_503_when_no_api_key_is_configured(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        config(['services.grok.key' => null]);

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'hint',
        ]);

        $response->assertStatus(503);
    }

    public function test_ask_mode_prompt_forbids_revealing_the_answer(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok("I can't give you the answer, but think about what happens to traction on a wet road.");

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'what is the correct answer?',
        ])->assertOk();

        // The system prompt sent to the model must carry the no-reveal guardrail even in ask mode —
        // this is the exact path that previously answered "the correct answer is ...".
        Http::assertSent(function ($request) {
            $system = $request->data()['messages'][0]['content'] ?? '';

            return str_contains($system, 'never reveal the answer')
                && str_contains($system, "can't give the answer");
        });
    }

    public function test_the_answer_is_kept_out_of_the_context_until_the_learner_answers(): void
    {
        // The guarantee the prompt alone could not give. Handed the correct option and the official
        // explanation, the model reworded them however firmly it was told not to — "move out of that
        // lane before the signal changes" for "Change lanes as soon as it is safe to do so". What it
        // is never sent, it cannot repeat.
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create([
            'question_text' => 'You see a steady yellow "X" signal over your traffic lane. What does it mean?',
            'explanation' => 'The lane is about to close. Move out of it as soon as you safely can.',
        ]);
        QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'Proceed with caution.']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['answer_text' => 'Change lanes as soon as it is safe to do so.']);

        $this->fakeGrok('This is one of the overhead lane-use signals.');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'What does it mean?',
            'answered' => false,
        ])->assertOk();

        Http::assertSent(function ($request) {
            $user = $request->data()['messages'][1]['content'] ?? '';

            // Both options still go, so the model knows what the learner is choosing between.
            return str_contains($user, 'Proceed with caution.')
                && str_contains($user, 'Change lanes as soon as it is safe to do so.')
                && ! str_contains($user, 'CORRECT ANSWER')
                && ! str_contains($user, 'OFFICIAL EXPLANATION')
                && ! str_contains($user, 'The lane is about to close');
        });
    }

    public function test_ask_mode_unlocks_the_full_explanation_once_answered(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok('That option is correct because a wet road reduces traction.');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'why is that the answer?',
            'answered' => true,
        ])->assertOk();

        // Once the learner has answered, the reveal is unlocked: the no-reveal guardrail must be gone
        // and the model explicitly permitted to name the correct option.
        Http::assertSent(function ($request) {
            $system = $request->data()['messages'][0]['content'] ?? '';

            return ! str_contains($system, 'never reveal the answer')
                && str_contains($system, 'already answered');
        });
    }

    public function test_hint_mode_never_reveals_even_after_answering(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrok('Think about how much room a motorcycle needs.');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'hint',
            'answered' => true,
        ])->assertOk();

        // Hint mode is always a nudge — even after answering it must keep the no-reveal guardrail.
        Http::assertSent(function ($request) {
            $system = $request->data()['messages'][0]['content'] ?? '';

            return str_contains($system, 'never reveal the answer');
        });
    }

    public function test_wrong_pick_is_surfaced_to_the_tutor_when_answered(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['answer_text' => 'Slow down']);
        $wrong = QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'Speed up']);
        $this->fakeGrok('You picked "Speed up", but on a wet road that reduces control.');

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'Why is my answer wrong?',
            'answered' => true,
            'selected_answer_id' => $wrong->id,
        ])->assertOk();

        // The learner's wrong pick must reach the model so it can address that specific choice.
        Http::assertSent(function ($request) {
            $user = $request->data()['messages'][1]['content'] ?? '';

            return str_contains($user, "LEARNER'S CHOSEN ANSWER (incorrect)")
                && str_contains($user, 'Speed up');
        });
    }

    public function test_wrong_pick_is_not_surfaced_before_answering(): void
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create();
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create();
        $wrong = QuizAnswer::factory()->for($question, 'quizQuestion')->create();
        $this->fakeGrok('Think about traction on a wet road.');

        // answered omitted (false): even with a selected id, nothing about the pick should leak.
        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'Why is my answer wrong?',
            'selected_answer_id' => $wrong->id,
        ])->assertOk();

        Http::assertSent(function ($request) {
            $user = $request->data()['messages'][1]['content'] ?? '';

            return ! str_contains($user, "LEARNER'S CHOSEN ANSWER");
        });
    }

    /** @param  list<string>  $replies  in order: the tutor's reply, the judge's verdict, then any retry. */
    private function fakeGrokSequence(array $replies): void
    {
        config([
            'services.grok.key' => 'test-key',
            'services.grok.model' => 'openai/gpt-oss-20b',
            'services.grok.base_url' => 'https://api.groq.com/openai/v1',
        ]);
        $sequence = Http::fakeSequence();
        foreach ($replies as $reply) {
            $sequence->push(['choices' => [['message' => ['role' => 'assistant', 'content' => $reply]]]]);
        }
    }

    /** @return array{quiz: Quiz, question: QuizQuestion} B is the correct option. */
    private function makeBlankQuestion(): array
    {
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create([
            'question_text' => 'Check that no vehicle is in ______ before you change lanes.',
        ]);
        QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'no-passing zones']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['answer_text' => 'blind spots']);

        return compact('quiz', 'question');
    }

    public function test_a_reply_that_gives_the_answer_away_is_written_again(): void
    {
        // No wording of the rules stopped this one: where the blank wants the NAME of something the
        // sentence already describes, the only thing the model has to say about it IS the definition,
        // and the definition picks the option. So the reply is put to the prompt's own test before it
        // goes out, and a leak buys one more attempt.
        ['quiz' => $quiz, 'question' => $question] = $this->makeBlankQuestion();
        $this->fakeGrokSequence([
            'Check the area your mirrors do not cover.',   // leaks: that is "blind spots" defined
            'blind spot',                                  // the checker names what the reply described
            'The sentence already says what you do there; the question is what it is called.',
            'NONE',                                        // the retry describes nothing
        ]);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", ['mode' => 'hint'])
            ->assertOk()
            ->assertJsonPath('reply', 'The sentence already says what you do there; the question is what it is called.');
    }

    public function test_a_reply_that_keeps_the_options_open_is_sent_as_it_is(): void
    {
        ['quiz' => $quiz, 'question' => $question] = $this->makeBlankQuestion();
        $this->fakeGrokSequence([
            'The question is asking you for the name of something. Think about what you were taught.',
            'NONE',
            'this retry must never be reached',
        ]);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", ['mode' => 'hint'])
            ->assertOk()
            ->assertJsonPath('reply', 'The question is asking you for the name of something. Think about what you were taught.');
    }

    public function test_the_checker_runs_as_a_separate_request_from_the_tutors(): void
    {
        // The correct answer reaches the checker but must never reach the tutor, which is only safe
        // because they are two requests that share no conversation.
        ['quiz' => $quiz, 'question' => $question] = $this->makeBlankQuestion();
        $this->fakeGrokSequence(['Check the area your mirrors do not cover.', 'blind spot', 'Try again.', 'NONE']);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", ['mode' => 'hint'])->assertOk();

        $sent = Http::recorded();
        $this->assertCount(4, $sent);
        // The tutor's own call carries the options but never the answer; the checker carries the answer.
        $this->assertStringNotContainsString('CORRECT ANSWER', $sent[0][0]->data()['messages'][1]['content']);
        $this->assertStringContainsString('mirrors do not cover', $sent[1][0]->data()['messages'][1]['content']);
    }

    public function test_an_already_answered_reply_is_never_second_guessed(): void
    {
        // Past the reveal the tutor is MEANT to name the correct option, so judging it would undo that.
        ['quiz' => $quiz, 'question' => $question] = $this->makeBlankQuestion();
        $this->fakeGrokSequence(['It is the blind spots — the area your mirrors do not cover.']);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", [
            'mode' => 'ask',
            'message' => 'why?',
            'answered' => true,
        ])->assertOk()->assertJsonPath('reply', 'It is the blind spots — the area your mirrors do not cover.');

        Http::assertSentCount(1);
    }

    public function test_a_question_that_cannot_be_hinted_safely_says_so(): void
    {
        // Both attempts give it away — which is what happens when the blank wants the NAME of something
        // the sentence already describes, because its definition IS the answer. Better to say so.
        ['quiz' => $quiz, 'question' => $question] = $this->makeBlankQuestion();
        $this->fakeGrokSequence([
            'Check the area your mirrors do not cover.',
            'blind spot',
            'It is the space your mirrors miss.',
            'blind spots',
        ]);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", ['mode' => 'hint'])
            ->assertOk()
            ->assertJsonPath('reply', "I can't point you at this one without handing it over — the question asks for the very thing the options give. Pick the one you were taught and I'll explain it fully.");
    }

    public function test_a_question_without_a_blank_is_not_checked(): void
    {
        // The check costs a second round trip, so it is spent only where the prompt alone cannot hold:
        // a blank wanting the name of what the sentence describes. Everything else answers in one call.
        ['quiz' => $quiz, 'question' => $question] = $this->makeQuestion();
        $this->fakeGrokSequence(['Think about what the shape of the sign implies.', 'blind spot']);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", ['mode' => 'hint'])
            ->assertOk()
            ->assertJsonPath('reply', 'Think about what the shape of the sign implies.');

        Http::assertSentCount(1);
    }

    public function test_a_reply_that_echoes_the_correct_option_is_written_again(): void
    {
        // Costs no round trip, so it runs on every question, not only the ones carrying a blank. This is
        // the shape it catches: the reply putting the winning option back in words of its own.
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create([
            'question_text' => 'A solid white line next to your lane means',
        ]);
        QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'you should reduce your speed.']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['answer_text' => 'you should stay in your lane.']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'you are allowed to make a U-turn.']);
        $this->fakeGrokSequence([
            'Select the option that best reflects that you must stay in your lane.',
            'Check each option against what a solid white line indicates, then pick the match.',
        ]);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", ['mode' => 'hint'])
            ->assertOk()
            ->assertJsonPath('reply', 'Check each option against what a solid white line indicates, then pick the match.');

        // No checker call: the echo is counted here, so only the tutor and its retry go out.
        Http::assertSentCount(2);
    }

    public function test_a_reply_that_only_echoes_the_question_is_left_alone(): void
    {
        // The learner is reading the question, so repeating its words gives nothing away. Only wording
        // that belongs to the correct option and not to the others counts.
        $quiz = Quiz::factory()->create(['is_active' => true]);
        $question = QuizQuestion::factory()->for($quiz, 'quiz')->create([
            'question_text' => 'A solid white line next to your lane means',
        ]);
        QuizAnswer::factory()->for($question, 'quizQuestion')->create(['answer_text' => 'you should reduce your speed.']);
        QuizAnswer::factory()->for($question, 'quizQuestion')->correct()->create(['answer_text' => 'you should stay in your lane.']);
        $this->fakeGrokSequence(['Think about what a solid white line next to your lane is for, then compare each option.']);

        $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$question->id}/assist", ['mode' => 'hint'])
            ->assertOk()
            ->assertJsonPath('reply', 'Think about what a solid white line next to your lane is for, then compare each option.');

        Http::assertSentCount(1);
    }

    public function test_question_not_belonging_to_the_quiz_is_rejected(): void
    {
        ['quiz' => $quiz] = $this->makeQuestion();
        $this->fakeGrok();
        $otherQuestion = QuizQuestion::factory()->create();

        $response = $this->postJson("/api/v1/quizzes/{$quiz->id}/questions/{$otherQuestion->id}/assist", [
            'mode' => 'hint',
        ]);

        $response->assertNotFound();
    }
}
