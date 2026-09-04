<?php

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

/**
 * One click during the scored phase, sent for live hit/miss feedback. The final grade is
 * recomputed from the whole log at submit time regardless of what this returned.
 */
class MarkHazardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'video_ms' => ['required', 'integer', 'min:0', 'max:36000000'],
            'x' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'y' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'guest_token' => ['nullable', 'string', 'max:64'],
        ];
    }
}
