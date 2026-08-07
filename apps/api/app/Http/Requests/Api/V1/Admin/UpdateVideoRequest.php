<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVideoRequest extends FormRequest
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
        if ($this->has('remove_thumbnail')) {
            $this->merge(['remove_thumbnail' => $this->boolean('remove_thumbnail')]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $video = $this->route('video');

        return [
            'quiz_category_id' => ['nullable', 'integer', 'exists:quiz_categories,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'vehicle_type_id' => ['nullable', 'integer', 'exists:vehicle_types,id'],
            'test_track' => ['nullable', Rule::in(['permit_test', 'driving_test'])],
            'section' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('videos', 'slug')->ignore($video->id),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'source_url' => ['nullable', 'string', 'url', 'max:500'],
            'external_url' => ['required_without_all:disk,path', 'nullable', 'string', 'url', 'max:500'],
            'disk' => ['required_without:external_url', 'nullable', 'string', 'max:50'],
            'path' => ['required_without:external_url', 'nullable', 'string', 'max:500'],
            'is_premium' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'order_no' => ['required', 'integer', 'min:0', 'max:999999'],
            'thumbnail' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
            'remove_thumbnail' => ['sometimes', 'boolean'],
        ];
    }
}
