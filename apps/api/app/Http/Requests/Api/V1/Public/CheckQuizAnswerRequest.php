<?php

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

class CheckQuizAnswerRequest extends FormRequest
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
            'answer_id' => ['required', 'integer'],
            // Optional — when sent (the web player always sends it once it's started an attempt),
            // this answer is persisted against that attempt so it survives a reload. Omitted
            // entirely, this endpoint stays exactly as stateless as it's always been (e.g. the
            // mobile app, which isn't wired up to the resume flow yet).
            'attempt_id' => ['nullable', 'integer', 'exists:quiz_attempts,id'],
        ];
    }
}
