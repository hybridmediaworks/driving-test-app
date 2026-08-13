<?php

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizQuestionReportRequest extends FormRequest
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
            'comment' => ['required', 'string', 'max:2000'],
            'flagged' => ['nullable', 'array'],
            'flagged.question' => ['nullable', 'boolean'],
            'flagged.image' => ['nullable', 'boolean'],
            'flagged.hint' => ['nullable', 'boolean'],
            'flagged.answers' => ['nullable', 'array'],
            'flagged.answers.*' => ['integer'],
            'reporter_name' => ['nullable', 'string', 'max:255'],
            'reporter_email' => ['nullable', 'email', 'max:255'],
        ];
    }
}
