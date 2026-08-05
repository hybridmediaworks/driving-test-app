<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\QuizCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin QuizCategory */
class QuizCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'title' => $this->title,
            'description' => $this->description,
            'order_no' => $this->order_no,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'quizzes_count' => $this->whenCounted('quizzes'),
        ];
    }
}
