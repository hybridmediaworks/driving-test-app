<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReviewerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('remove_photo')) {
            $this->merge(['remove_photo' => $this->boolean('remove_photo')]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'verified_at' => ['required', 'date'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
            'remove_photo' => ['sometimes', 'boolean'],
        ];
    }
}
