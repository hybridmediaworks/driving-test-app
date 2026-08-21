<?php

namespace App\Actions\Quiz;

use App\Enums\ImageRegenerationStatus;
use App\Models\QuizImageRegeneration;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Reject a regenerated candidate. The row is just marked rejected (the original image is untouched);
 * a later `content:regenerate-quiz-images --only=rejected` run makes a fresh candidate and moves it
 * back to awaiting_review.
 */
class RejectImageRegeneration
{
    public function __invoke(QuizImageRegeneration $row, User $admin): QuizImageRegeneration
    {
        if ($row->status !== ImageRegenerationStatus::AwaitingReview) {
            throw ValidationException::withMessages(['status' => __('This image is not awaiting review.')]);
        }

        $row->update([
            'status' => ImageRegenerationStatus::Rejected,
            'admin_user_id' => $admin->id,
            'decided_at' => now(),
        ]);

        return $row->fresh();
    }
}
