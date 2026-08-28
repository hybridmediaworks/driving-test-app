<?php

namespace App\Mail;

use App\Models\EmailSubscriber;
use App\Models\QuizQuestion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DailyQuestionMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly EmailSubscriber $subscriber,
        public readonly QuizQuestion $question,
    ) {}

    public function build(): self
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return $this->subject(__('Your daily :state practice question', ['state' => $this->subscriber->state ?? 'DMV']))
            ->view('mail.daily-question', [
                'question' => $this->question,
                'unsubscribeUrl' => "{$frontendUrl}/unsubscribe/{$this->subscriber->unsubscribe_token}",
            ]);
    }
}
