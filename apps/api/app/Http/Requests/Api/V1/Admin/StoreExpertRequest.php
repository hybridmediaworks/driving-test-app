<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Http\Requests\Api\V1\Admin\Concerns\ValidatesExpert;
use Illuminate\Foundation\Http\FormRequest;

class StoreExpertRequest extends FormRequest
{
    use ValidatesExpert;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // Slug is optional on create — the controller derives a unique one from the name when it's
        // left blank — but if given it must be a well-formed, unused slug.
        return $this->expertRules([
            'nullable',
            'string',
            'max:255',
            'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'unique:experts,slug',
        ]);
    }
}
