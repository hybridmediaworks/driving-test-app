<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Staff-editable fields of a hazard simulator. The catalog identity (title, thumbnail, premium,
 * state/vehicle) lives on the Video and is managed at /admin/videos; `slug`, `sim_id`, `video_id`
 * and the cached counts are never hand-edited.
 */
class UpdateHazardSimulatorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['is_active', 'content_locked'] as $flag) {
            if ($this->has($flag)) {
                $this->merge([$flag => $this->boolean($flag)]);
            }
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'test_level' => ['nullable', 'string', 'max:50'],
            'test_location' => ['nullable', 'string', 'max:120'],
            'test_number' => ['nullable', 'string', 'max:20'],
            // null = score-only, no pass/fail shown.
            'pass_threshold_percent' => ['nullable', 'integer', 'min:1', 'max:100'],
            'scoring_profile' => ['required', Rule::in(array_keys((array) config('hazard.profiles')))],
            'is_active' => ['required', 'boolean'],
            'content_locked' => ['required', 'boolean'],
        ];
    }
}
