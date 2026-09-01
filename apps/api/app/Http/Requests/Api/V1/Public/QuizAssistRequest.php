<?php

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuizAssistRequest extends FormRequest
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
            'mode' => ['required', Rule::in(['hint', 'ask'])],
            'message' => ['required_if:mode,ask', 'nullable', 'string', 'max:1000'],
            // Whether the learner has already answered this question. Gates the reveal: the full
            // explanation is only unlocked once true (defaults to false when absent).
            'answered' => ['sometimes', 'boolean'],
            // The option the learner picked. Lets the tutor explain why THAT specific choice is wrong.
            // Only honoured once answered; ignored otherwise.
            'selected_answer_id' => ['sometimes', 'nullable', 'integer'],
        ];
    }
}
