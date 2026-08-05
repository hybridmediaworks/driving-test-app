<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Quiz;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ReorderQuizQuestionsRequest extends FormRequest
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
        /** @var Quiz $quiz */
        $quiz = $this->route('quiz');

        return [
            'order' => ['required', 'array', 'min:1'],
            'order.*' => [
                'integer',
                Rule::exists('quiz_questions', 'id')->where('quiz_id', $quiz->id),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Quiz $quiz */
            $quiz = $this->route('quiz');
            $order = $this->input('order', []);

            if (! is_array($order)) {
                return;
            }

            if (count($order) !== count(array_unique($order))) {
                $validator->errors()->add('order', __('Each question may appear only once in the order.'));
            }

            $expected = $quiz->quizQuestions()->count();
            if (count($order) !== $expected) {
                $validator->errors()->add(
                    'order',
                    __('You must include every question for this quiz (:expected total).', ['expected' => $expected]),
                );
            }
        });
    }
}
