<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\BillingInterval;
use App\Enums\PlanType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Deliberately excludes stripe_price_id/stripe_product_id — those are derived from Stripe
     * via `php artisan billing:sync-plans`, never hand-entered, so the plans table can't drift
     * from what Stripe actually charges.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'key' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9]+(?:_[a-z0-9]+)*$/', 'unique:plans,key'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(PlanType::class)],
            'billing_interval' => ['nullable', Rule::enum(BillingInterval::class)],
            'price_cents' => ['required', 'integer', 'min:0'],
            'max_seats' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:65535'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'key.regex' => 'The key may only contain lowercase letters, numbers, and single underscores between segments.',
        ];
    }
}
