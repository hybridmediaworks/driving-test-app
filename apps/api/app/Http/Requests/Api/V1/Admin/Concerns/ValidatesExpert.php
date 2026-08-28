<?php

namespace App\Http\Requests\Api\V1\Admin\Concerns;

use Illuminate\Support\Str;

/**
 * Shared validation for creating and updating an Expert. The only difference between the two is
 * the slug's uniqueness rule (ignore-self on update), which each request supplies.
 */
trait ValidatesExpert
{
    /**
     * @param  array<int, mixed>  $slugRule
     * @return array<string, array<int, mixed>>
     */
    protected function expertRules(array $slugRule): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => $slugRule,
            'title' => ['required', 'string', 'max:255'],
            'credentials' => ['nullable', 'string', 'max:255'],
            'role_label' => ['nullable', 'string', 'max:255'],
            'intro' => ['nullable', 'string', 'max:5000'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'sections' => ['nullable', 'array', 'max:40'],
            'sections.*.heading' => ['required', 'string', 'max:255'],
            'sections.*.body' => ['required', 'string', 'max:20000'],
            'verified_at' => ['required', 'date'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'is_published' => ['sometimes', 'boolean'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,gif,webp', 'max:5120'],
            'remove_photo' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug may only contain lowercase letters, numbers, and single hyphens between segments.',
            'sections.*.heading.required' => 'Each section needs a heading.',
            'sections.*.body.required' => 'Each section needs body text.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->filled('slug')) {
            $merge['slug'] = Str::slug((string) $this->input('slug'));
        }
        if ($this->has('remove_photo')) {
            $merge['remove_photo'] = $this->boolean('remove_photo');
        }
        if ($this->has('is_published')) {
            $merge['is_published'] = $this->boolean('is_published');
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }
}
