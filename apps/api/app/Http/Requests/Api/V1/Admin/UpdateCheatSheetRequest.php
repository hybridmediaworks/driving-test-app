<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCheatSheetRequest extends FormRequest
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
        $cheatSheet = $this->route('cheatSheet');

        return [
            'quiz_category_id' => ['nullable', 'integer', 'exists:quiz_categories,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'vehicle_type_id' => ['nullable', 'integer', 'exists:vehicle_types,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('cheat_sheets', 'slug')->ignore($cheatSheet->id),
            ],
            'summary' => ['required', 'string', 'max:500'],
            'order_no' => ['required', 'integer', 'min:0', 'max:999999'],
            'is_premium' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
            'remove_cover_image' => ['sometimes', 'boolean'],
            'sections' => ['required', 'array', 'min:1', 'max:50'],
            'sections.*.heading' => ['required', 'string', 'max:255'],
            'sections.*.body_markdown' => ['required', 'string', 'max:20000'],
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
            'title' => 'title',
            'slug' => 'slug',
            'summary' => 'summary',
            'order_no' => 'sheet order',
            'is_premium' => 'access',
            'is_active' => 'status',
            'cover_image' => 'cover image',
            'remove_cover_image' => 'remove cover image',
            'sections' => 'sections',
            'sections.*.heading' => 'section heading',
            'sections.*.body_markdown' => 'section content',
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
