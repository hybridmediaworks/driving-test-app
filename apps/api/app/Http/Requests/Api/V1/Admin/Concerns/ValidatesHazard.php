<?php

namespace App\Http\Requests\Api\V1\Admin\Concerns;

use App\Enums\HazardType;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Shared validation for creating and updating a single hazard. Store passes `required`,
 * Update passes `sometimes` for the always-present fields — everything else is identical.
 */
trait ValidatesHazard
{
    /**
     * @param  'required'|'sometimes'  $presence
     * @return array<string, array<int, mixed>>
     */
    protected function hazardRules(string $presence): array
    {
        return [
            'type' => [$presence, Rule::enum(HazardType::class)],
            'mode' => [$presence, Rule::in(['demo', 'assessment'])],
            'in_timeline' => [$presence, 'boolean'],
            'time_start' => [$presence, 'numeric', 'min:0', 'max:36000'],
            'time_end' => [$presence, 'numeric', 'min:0', 'max:36000'],
            'frame_count' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'box' => ['nullable', 'array'],
            'box.x' => ['required_with:box', 'numeric', 'min:0', 'max:1'],
            'box.y' => ['required_with:box', 'numeric', 'min:0', 'max:1'],
            'box.w' => ['required_with:box', 'numeric', 'min:0', 'max:1'],
            'box.h' => ['required_with:box', 'numeric', 'min:0', 'max:1'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'audio_url' => ['nullable', 'url', 'max:500'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('in_timeline')) {
            $this->merge(['in_timeline' => $this->boolean('in_timeline')]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $start = $this->input('time_start');
            $end = $this->input('time_end');
            if (is_numeric($start) && is_numeric($end) && (float) $end <= (float) $start) {
                $validator->errors()->add('time_end', __('The hazard window must end after it starts.'));
            }
        });
    }
}
