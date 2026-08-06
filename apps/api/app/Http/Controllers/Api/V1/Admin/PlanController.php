<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StorePlanRequest;
use App\Http\Requests\Api\V1\Admin\UpdatePlanRequest;
use App\Http\Resources\Api\V1\Admin\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlanController extends Controller
{
    /**
     * List plans (admin)
     *
     * Requires an admin account. Paginated (standard Laravel Resource collection envelope).
     * Includes inactive plans and Stripe IDs, unlike the public endpoint.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = $request->integer('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $plans = Plan::query()
            ->orderBy('sort_order')
            ->paginate($perPage)
            ->withQueryString();

        return PlanResource::collection($plans);
    }

    /**
     * Create a plan (admin)
     *
     * Only pricing/copy fields are settable here — `stripe_price_id`/`stripe_product_id` stay
     * null until `php artisan billing:sync-plans` creates the real Stripe Product/Price for it.
     */
    public function store(StorePlanRequest $request): JsonResponse
    {
        $plan = Plan::query()->create($request->validated());

        return response()->json(['plan' => new PlanResource($plan)], 201);
    }

    /**
     * Show a plan (admin)
     */
    public function show(Plan $plan): JsonResponse
    {
        return response()->json(['plan' => new PlanResource($plan)]);
    }

    /**
     * Update a plan (admin)
     *
     * `price_cents`/`billing_interval`/`type` are rejected (422, see UpdatePlanRequest) once the
     * plan has a real `stripe_price_id` — Stripe Prices are immutable, so "editing" one of those
     * fields here could only ever change what we display, never what's actually charged at
     * checkout. Create a new plan instead; `billing:sync-plans` provisions its real Stripe Price
     * automatically since it starts with a null stripe_price_id.
     */
    public function update(UpdatePlanRequest $request, Plan $plan): JsonResponse
    {
        $plan->update($request->validated());

        return response()->json(['plan' => new PlanResource($plan->fresh())]);
    }

    /**
     * Delete a plan (admin)
     *
     * Returns 422 if the plan has ever been synced to Stripe (has a stripe_price_id) or has any
     * family groups purchased against it — deleting either would orphan real billing/purchase
     * history. Deactivate (`is_active = false`) instead; only a plan created by mistake and never
     * synced can be hard-deleted.
     */
    public function destroy(Plan $plan): JsonResponse
    {
        if ($plan->stripe_price_id !== null || $plan->familyGroups()->exists()) {
            return response()->json([
                'message' => __('This plan has real billing history — deactivate it instead of deleting it.'),
            ], 422);
        }

        $plan->delete();

        return response()->json(['message' => __('Plan deleted.')]);
    }
}
