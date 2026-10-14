<?php

namespace App\Actions\Auth;

use App\Models\ChallengeBankItem;
use App\Models\HazardSimulatorAttempt;
use App\Models\QuizAttempt;
use App\Models\User;

class ClaimGuestData
{
    public function __invoke(User $user, mixed $guestToken): void
    {
        if (! is_string($guestToken) || $guestToken === '') {
            return;
        }

        QuizAttempt::query()
            ->where('guest_token', $guestToken)
            ->whereNull('user_id')
            ->update(['user_id' => $user->id, 'guest_token' => null]);

        HazardSimulatorAttempt::query()
            ->where('guest_token', $guestToken)
            ->whereNull('user_id')
            ->update(['user_id' => $user->id, 'guest_token' => null]);

        $alreadyBanked = ChallengeBankItem::query()
            ->where('user_id', $user->id)
            ->pluck('quiz_question_id');

        ChallengeBankItem::query()
            ->where('guest_token', $guestToken)
            ->whereNull('user_id')
            ->whereIn('quiz_question_id', $alreadyBanked)
            ->delete();

        ChallengeBankItem::query()
            ->where('guest_token', $guestToken)
            ->whereNull('user_id')
            ->update(['user_id' => $user->id, 'guest_token' => null]);
    }
}
