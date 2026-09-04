<?php

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The full click log for a finished run. `events` may be empty — a learner who never clicked
 * still gets a graded (zero-detection) result.
 */
class StoreHazardAttemptRequest extends FormRequest
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
            'events' => ['present', 'array', 'max:400'],
            'events.*.video_ms' => ['required', 'integer', 'min:0', 'max:36000000'],
            'events.*.x' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'events.*.y' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:86400'],
            'guest_token' => ['nullable', 'string', 'max:64'],
        ];
    }
}
