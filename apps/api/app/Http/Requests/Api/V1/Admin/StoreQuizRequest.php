<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\TestTrack;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuizRequest extends FormRequest
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
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'quiz_category_id' => ['required', 'integer', 'exists:quiz_categories,id'],
            'quiz_type_id' => ['required', 'integer', 'exists:quiz_types,id'],
            'state_id' => ['required', 'integer', 'exists:states,id'],
            'vehicle_type_id' => ['required', 'integer', 'exists:vehicle_types,id'],
            'title' => ['required', 'string', 'max:255'],
            'order_no' => ['required', 'integer', 'min:0', 'max:999999'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:quizzes,slug'],
            'test_track' => ['required', Rule::enum(TestTrack::class)],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:86400'],
            'passing_score_percent' => ['nullable', 'integer', 'min:1', 'max:100'],
            'is_premium' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
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
            'passing_score_percent' => 'passing score',
            'is_premium' => 'access',
            'is_active' => 'status',
            'cover_image' => 'cover image',
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
