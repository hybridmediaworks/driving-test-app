<?php

namespace App\Actions\Newsletter;

use App\Enums\TestTrack;
use App\Models\EmailSubscriber;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\State;

class SelectDailyQuestionForSubscriber
{
    /**
     * Picks one random free, active, permit-test question matching the subscriber's state and
     * vehicle type. Returns null (never throws) when there's nothing eligible to send — an
     * unresolvable/missing state, or a state with no matching quiz — so the caller can skip this
     * subscriber without aborting the rest of the batch.
     */
    public function __invoke(EmailSubscriber $subscriber): ?QuizQuestion
    {
        if (! $subscriber->state) {
            return null;
        }

        $state = State::query()->where('name', $subscriber->state)->first();

        if (! $state) {
            return null;
        }

        $vehicleType = $subscriber->vehicle_type ?? 'car';

        $quiz = Quiz::query()
            ->forState($state->code)
            ->forVehicleType($vehicleType)
            ->where('is_active', true)
            ->where('is_premium', false)
            ->where('test_track', TestTrack::PermitTest)
            ->inRandomOrder()
            ->first();

        if (! $quiz) {
            return null;
        }

        return QuizQuestion::query()
            ->where('quiz_id', $quiz->id)
            ->with('answers')
            ->inRandomOrder()
            ->first();
    }
}
