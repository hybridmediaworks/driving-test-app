<?php

namespace App\Http\Resources\Api\V1\Public;

use App\Models\QuizQuestionAsset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin QuizQuestionAsset */
class QuizQuestionAssetResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'url' => $this->url,
            'duration_seconds' => $this->duration_seconds,
        ];
    }
}
