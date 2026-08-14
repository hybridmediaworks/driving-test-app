<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAmbientTrackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
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
            'quiz_category_id' => ['nullable', 'integer', 'exists:quiz_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            // Exactly one of external_url or disk+path — same convention as videos.
            'external_url' => ['required_without_all:disk,path', 'nullable', 'string', 'url', 'max:500'],
            'disk' => ['required_without:external_url', 'nullable', 'string', 'max:50'],
            'path' => ['required_without:external_url', 'nullable', 'string', 'max:500'],
            'is_active' => ['required', 'boolean'],
            'order_no' => ['required', 'integer', 'min:0', 'max:999999'],
        ];
    }
}
