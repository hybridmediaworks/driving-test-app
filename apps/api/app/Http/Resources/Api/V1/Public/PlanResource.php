<?php

namespace App\Http\Resources\Api\V1\Public;

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
            'max_seats' => $this->max_seats,
            'sort_order' => $this->sort_order,
        ];
    }
}
