<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\ReviewerProfileResource;
use App\Models\ReviewerProfile;
use Illuminate\Http\JsonResponse;

class ReviewerProfileController extends Controller
{
    /**
     * The site's "accuracy verified by" reviewer badge
     *
     * Public — no authentication required. A single, site-wide profile (name, credentials line,
     * last-verified date, and an optional photo) shown on state pages and quiz pages as a trust
     * signal. Admin-managed — see Admin\ReviewerProfileController.
     */
    public function show(): JsonResponse
    {
        return response()->json(['reviewer' => new ReviewerProfileResource(ReviewerProfile::current())]);
    }
}
