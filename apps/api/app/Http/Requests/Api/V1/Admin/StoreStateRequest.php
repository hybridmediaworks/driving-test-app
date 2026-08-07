<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreStateRequest extends FormRequest
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
            'code' => ['required', 'string', 'size:2', 'uppercase', 'unique:states,code'],
            'name' => ['required', 'string', 'max:100', 'unique:states,name'],
            'agency_name' => ['nullable', 'string', 'max:100'],
            'dmv_website_url' => ['nullable', 'string', 'url', 'max:255'],
        ];
    }
}
