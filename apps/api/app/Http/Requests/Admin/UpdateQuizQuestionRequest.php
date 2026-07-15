<?php

namespace App\Http\Requests\Admin;

use App\Enums\QuestionDifficulty;
use App\Models\QuizQuestion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateQuizQuestionRequest extends FormRequest
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
            'keep_images' => ['nullable', 'string', 'max:10000'],
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

            $question = $this->route('question');
            if (! $question instanceof QuizQuestion) {
                return;
            }

            $oldImages = $question->images ?? [];
            $keepCount = 0;
            $json = $this->input('keep_images');
            if (is_string($json) && $json !== '') {
                $decoded = json_decode($json, true);
                if (is_array($decoded)) {
                    $decoded = array_values(array_filter($decoded, 'is_string'));
                    $keepCount = count(array_intersect($decoded, $oldImages));
                }
            }

            $files = $this->file('images', []);
            if (! is_array($files)) {
                $files = [];
            }
            $newCount = count(array_filter(
                $files,
                fn ($f) => $f instanceof UploadedFile && $f->isValid(),
            ));

            if ($keepCount + $newCount > 10) {
                $validator->errors()->add('images', __('At most 10 images per question.'));
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
