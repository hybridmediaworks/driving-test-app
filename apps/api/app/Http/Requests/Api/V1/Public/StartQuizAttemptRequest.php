<?php

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

class StartQuizAttemptRequest extends FormRequest
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
            // true always starts a brand-new attempt (used by Restart) instead of resuming
            // whatever in-progress attempt already exists for this quiz+caller, if any.
            'force_new' => ['nullable', 'boolean'],
            'guest_token' => ['nullable', 'string', 'max:64'],
        ];
    }
}
