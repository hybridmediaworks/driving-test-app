<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\PlanResource;
use App\Models\Plan;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlanController extends Controller
{
    /**
     * List plans
     *
     * Public — no authentication required. Active plans only, ordered for pricing-page display.
     * Prices here are always the source of truth (never hardcode pricing on the frontend) — each
     * plan's `stripe_price_id` is resolved server-side at checkout time, never sent to the client.
     */
    public function index(): AnonymousResourceCollection
    {
        return PlanResource::collection(
            Plan::query()->where('is_active', true)->orderBy('sort_order')->get()
        );
    }
}
