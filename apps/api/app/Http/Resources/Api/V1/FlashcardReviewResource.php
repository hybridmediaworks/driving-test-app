<?php

namespace App\Http\Resources\Api\V1;

use App\Models\FlashcardReview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FlashcardReview */
class FlashcardReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'flashcard_id' => $this->flashcard_id,
            'status' => $this->status,
            'reviewed_at' => $this->reviewed_at,
        ];
    }
}
