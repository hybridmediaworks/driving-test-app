<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\QuizAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Pre-submission answer option — deliberately excludes is_correct and explanation.
 *
 * @mixin QuizAnswer
 */
class QuizAnswerOptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'answer_text' => $this->answer_text,
        ];
    }
}
