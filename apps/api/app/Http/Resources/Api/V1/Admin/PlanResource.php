<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Plan */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name' => $this->name,
            'type' => $this->type,
            'billing_interval' => $this->billing_interval,
            'price_cents' => $this->price_cents,
            // Derived from Stripe via `php artisan billing:sync-plans` — never admin-editable,
            // see Store/UpdatePlanRequest.
            'stripe_price_id' => $this->stripe_price_id,
            'stripe_product_id' => $this->stripe_product_id,
            'max_seats' => $this->max_seats,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
