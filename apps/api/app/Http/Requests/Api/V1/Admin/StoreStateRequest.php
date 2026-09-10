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
            'permit_test_fee_cents' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'retake_wait_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'supervised_driving_hours' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'minimum_permit_age' => ['nullable', 'integer', 'min:13', 'max:21'],
            'test_language_count' => ['nullable', 'integer', 'min:1', 'max:100'],
            'online_testing_available' => ['nullable', 'boolean'],
        ];
    }
}
