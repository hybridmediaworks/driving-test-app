<?php

namespace App\Actions\Flashcard;

use App\Enums\FlashcardReviewStatus;
use App\Models\Flashcard;
use App\Models\FlashcardReview;
use App\Models\User;

class RecordFlashcardReview
{
    public function __invoke(User $user, Flashcard $flashcard, FlashcardReviewStatus $status): FlashcardReview
    {
        return FlashcardReview::query()->updateOrCreate(
            ['user_id' => $user->id, 'flashcard_id' => $flashcard->id],
            ['status' => $status, 'reviewed_at' => now()],
        );
    }
}
