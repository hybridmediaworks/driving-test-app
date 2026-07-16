<?php

namespace App\Http\Requests\Api\V1\Public;

use App\Models\QuizQuestion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreQuizAttemptRequest extends FormRequest
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
            'answers' => ['required', 'array', 'min:1'],
            'answers.*.question_id' => ['required', 'integer', 'distinct'],
            'answers.*.answer_id' => ['nullable', 'integer'],
            'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:86400'],
            'guest_token' => ['nullable', 'string', 'max:64'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $quiz = $this->route('quiz');
            $answers = $this->input('answers', []);
            if (! is_array($answers)) {
                return;
            }

            $validQuestionIds = QuizQuestion::query()
                ->where('quiz_id', $quiz->id)
                ->pluck('id')
                ->all();

            foreach ($answers as $index => $row) {
                if (! is_array($row) || ! isset($row['question_id'])) {
                    continue;
                }

                if (! in_array((int) $row['question_id'], $validQuestionIds, true)) {
                    $validator->errors()->add("answers.{$index}.question_id", __('This question does not belong to the quiz.'));
                }
            }
        });
    }
}
