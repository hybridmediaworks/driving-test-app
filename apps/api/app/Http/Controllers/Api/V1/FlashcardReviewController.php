<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Flashcard\RecordFlashcardReview;
use App\Enums\FlashcardReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RecordFlashcardReviewRequest;
use App\Http\Resources\Api\V1\FlashcardReviewResource;
use App\Models\Flashcard;
use Illuminate\Http\JsonResponse;

class FlashcardReviewController extends Controller
{
    public function __construct(
        private readonly RecordFlashcardReview $recordReview,
    ) {}

    /**
     * Record whether I knew a flashcard
     *
     * Requires authentication — flashcard study progress is only ever persisted for signed-in
     * users, guests get an ephemeral client-only shuffle. `status` is `known` or `unknown` (or
     * `new` to reset a card back to unreviewed). Upserts — resubmitting the same card just
     * updates its status and `reviewed_at`, it does not create a second row.
     *
     * Gated by `readFull`, not `view` — recording "known"/"unknown" only makes sense for a card
     * whose back the caller actually saw. A locked (premium, not entitled) card has nothing to
     * have known.
     */
    public function store(RecordFlashcardReviewRequest $request, Flashcard $flashcard): JsonResponse
    {
        $this->authorize('readFull', $flashcard);

        $status = FlashcardReviewStatus::from($request->validated('status'));
        $review = ($this->recordReview)($request->user(), $flashcard, $status);

        return response()->json(['review' => new FlashcardReviewResource($review)], 201);
    }
}
