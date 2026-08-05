<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCheckoutRequest extends FormRequest
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
            'plan_key' => [
                'required',
                'string',
                // Rule::exists()'s where() only supports equality — a `>` comparison needs the
                // custom query-callback escape hatch instead.
                Rule::exists('plans', 'key')
                    ->where('is_active', true)
                    ->using(fn ($query) => $query->where('price_cents', '>', 0)),
            ],
        ];
    }
}
