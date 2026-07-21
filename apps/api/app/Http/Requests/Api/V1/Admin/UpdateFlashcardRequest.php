<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFlashcardRequest extends FormRequest
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
        if ($this->has('remove_image')) {
            $this->merge(['remove_image' => $this->boolean('remove_image')]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'quiz_category_id' => ['nullable', 'integer', 'exists:quiz_categories,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'vehicle_type_id' => ['nullable', 'integer', 'exists:vehicle_types,id'],
            'front_text' => ['required', 'string', 'max:500'],
            'back_text' => ['required', 'string', 'max:5000'],
            'topic' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:999999'],
            'is_premium' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'quiz_category_id' => 'category',
            'state_id' => 'state',
            'vehicle_type_id' => 'vehicle',
            'front_text' => 'front text',
            'back_text' => 'back text',
            'topic' => 'topic',
            'sort_order' => 'card order',
            'is_premium' => 'access',
            'is_active' => 'status',
            'image' => 'image',
            'remove_image' => 'remove image',
        ];
    }
}
