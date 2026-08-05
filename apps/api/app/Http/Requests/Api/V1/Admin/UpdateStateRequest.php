<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStateRequest extends FormRequest
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
        $state = $this->route('state');

        return [
            'code' => ['required', 'string', 'size:2', 'uppercase', Rule::unique('states', 'code')->ignore($state->id)],
            'name' => ['required', 'string', 'max:100', Rule::unique('states', 'name')->ignore($state->id)],
        ];
    }
}
