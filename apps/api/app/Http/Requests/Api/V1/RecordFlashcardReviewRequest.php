<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\FlashcardReviewStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordFlashcardReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(FlashcardReviewStatus::class)],
        ];
    }
}
