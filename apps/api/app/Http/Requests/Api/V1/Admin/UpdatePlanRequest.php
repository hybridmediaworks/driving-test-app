<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\BillingInterval;
use App\Enums\PlanType;
use App\Models\Plan;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlanRequest extends FormRequest
{
    /**
     * The fields that actually determine what Stripe charges. Once a plan has a real
     * stripe_price_id, these can't be changed here — Stripe Prices are immutable, so "editing"
     * one in our own table would silently desync the display from what's actually charged at
     * checkout. See withValidator() below; the fix is a new plan, not an edit.
     */
    private const MONEY_FIELDS = ['price_cents', 'billing_interval', 'type'];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Deliberately excludes stripe_price_id/stripe_product_id — see StorePlanRequest.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $plan = $this->route('plan');

        return [
            'key' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9]+(?:_[a-z0-9]+)*$/', Rule::unique('plans', 'key')->ignore($plan->id)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(PlanType::class)],
            'billing_interval' => ['nullable', Rule::enum(BillingInterval::class)],
            'price_cents' => ['required', 'integer', 'min:0'],
            'trial_days' => ['nullable', 'integer', 'min:1', 'max:90'],
            'max_seats' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:65535'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            /** @var Plan $plan */
            $plan = $this->route('plan');
            if ($plan->stripe_price_id === null) {
                return;
            }

            $current = [
                'price_cents' => $plan->price_cents,
                'billing_interval' => $plan->billing_interval?->value,
                'type' => $plan->type->value,
            ];

            foreach (self::MONEY_FIELDS as $field) {
                $incoming = $this->input($field);
                $incoming = $field === 'price_cents' && $incoming !== null ? (int) $incoming : $incoming;

                if ($incoming !== $current[$field]) {
                    $validator->errors()->add(
                        $field,
                        __('This plan is already synced to Stripe — :field can\'t be changed here. Create a new plan instead.', ['field' => str_replace('_', ' ', $field)]),
                    );
                }
            }
        });
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
