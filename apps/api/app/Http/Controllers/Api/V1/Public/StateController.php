<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\StateResource;
use App\Models\State;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StateController extends Controller
{
    /**
     * List states
     *
     * Public — no authentication required. Alphabetical by name, not paginated — the full seeded
     * list (all US states) is small enough to return in one response. Use `code` as the value for
     * the `state` filter on `GET /quizzes`.
     */
    public function index(): AnonymousResourceCollection
    {
        return StateResource::collection(State::query()->orderBy('name')->get());
    }
}
