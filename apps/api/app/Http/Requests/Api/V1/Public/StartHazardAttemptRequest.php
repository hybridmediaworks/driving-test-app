<?php

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

class StartHazardAttemptRequest extends FormRequest
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
            // true always opens a brand-new attempt (Try Again) rather than folding a very fresh
            // in-progress one back in.
            'force_new' => ['nullable', 'boolean'],
            'guest_token' => ['nullable', 'string', 'max:64'],
        ];
    }
}
