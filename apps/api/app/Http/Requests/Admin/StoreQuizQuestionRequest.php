<?php

namespace App\Http\Requests\Admin;

use App\Enums\QuestionDifficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreQuizQuestionRequest extends FormRequest
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
            'question_text' => ['required', 'string', 'max:20000'],
            'explanation' => ['nullable', 'string', 'max:20000'],
            'difficulty' => ['required', Rule::enum(QuestionDifficulty::class)],
            'topic' => ['nullable', 'string', 'max:255'],
            'images' => ['sometimes', 'nullable', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
            'answers' => ['required', 'array', 'min:2', 'max:12'],
            'answers.*.answer_text' => ['required', 'string', 'max:5000'],
            'answers.*.explanation' => ['nullable', 'string', 'max:20000'],
            'answers.*.is_correct' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $answers = $this->input('answers', []);
            if (! is_array($answers)) {
                return;
            }

            $correctCount = collect($answers)->where('is_correct', true)->count();
            if ($correctCount !== 1) {
                $validator->errors()->add('answers', __('Exactly one answer must be marked as correct.'));
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'question_text' => 'question',
            'explanation' => 'explanation',
            'difficulty' => 'difficulty',
            'topic' => 'topic',
            'images' => 'images',
            'answers' => 'answers',
            'answers.*.answer_text' => 'answer text',
            'answers.*.explanation' => 'answer feedback',
        ];
    }
}
