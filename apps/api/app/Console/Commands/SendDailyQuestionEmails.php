<?php

namespace App\Console\Commands;

use App\Actions\Newsletter\SelectDailyQuestionForSubscriber;
use App\Mail\DailyQuestionMail;
use App\Models\EmailSubscriber;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendDailyQuestionEmails extends Command
{
    protected $signature = 'newsletter:send-daily-questions';

    protected $description = 'Emails one practice question to every active subscriber who has not already been sent one today.';

    public function handle(SelectDailyQuestionForSubscriber $selectQuestion): int
    {
        $sent = 0;
        $skipped = 0;
        $errors = 0;

        EmailSubscriber::query()
            ->whereNull('unsubscribed_at')
            ->where(fn ($q) => $q->whereNull('last_sent_at')->orWhereDate('last_sent_at', '<', today()))
            ->chunkById(200, function ($subscribers) use ($selectQuestion, &$sent, &$skipped, &$errors) {
                foreach ($subscribers as $subscriber) {
                    try {
                        $question = $selectQuestion($subscriber);

                        if (! $question) {
                            $skipped++;

                            continue;
                        }

                        Mail::to($subscriber->email)->send(new DailyQuestionMail($subscriber, $question));
                        $subscriber->update(['last_sent_at' => now()]);
                        $sent++;
                    } catch (Throwable $e) {
                        $errors++;
                        Log::warning('Daily question email failed', [
                            'subscriber_id' => $subscriber->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });

        $this->info("Sent: {$sent}, skipped: {$skipped}, errors: {$errors}");

        return self::SUCCESS;
    }
}
