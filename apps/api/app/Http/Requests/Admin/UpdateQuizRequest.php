<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_premium')) {
            $this->merge(['is_premium' => $this->boolean('is_premium')]);
        }
        if ($this->has('is_active')) {
            $this->merge(['is_active' => $this->boolean('is_active')]);
        }
        if ($this->has('remove_cover_image')) {
            $this->merge(['remove_cover_image' => $this->boolean('remove_cover_image')]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $quiz = $this->route('quiz');

        return [
            'quiz_category_id' => ['required', 'integer', 'exists:quiz_categories,id'],
            'quiz_type_id' => ['required', 'integer', 'exists:quiz_types,id'],
            'state_id' => ['required', 'integer', 'exists:states,id'],
            'vehicle_type_id' => ['required', 'integer', 'exists:vehicle_types,id'],
            'title' => ['required', 'string', 'max:255'],
            'order_no' => ['required', 'integer', 'min:0', 'max:999999'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('quizzes', 'slug')->ignore($quiz->id),
            ],
            'test_track' => ['required', 'string', 'in:permit_test,driving_test'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:86400'],
            'is_premium' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
            'remove_cover_image' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'quiz_category_id' => 'category',
            'quiz_type_id' => 'quiz type',
            'state_id' => 'state',
            'vehicle_type_id' => 'vehicle',
            'title' => 'title',
            'order_no' => 'quiz order',
            'slug' => 'slug',
            'test_track' => 'track',
            'duration_seconds' => 'duration',
            'is_premium' => 'access',
            'is_active' => 'status',
            'cover_image' => 'cover image',
            'remove_cover_image' => 'remove cover image',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug may only contain lowercase letters, numbers, and single hyphens between segments.',
        ];
    }
}
