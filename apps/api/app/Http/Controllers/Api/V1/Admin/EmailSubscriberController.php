<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Admin\EmailSubscriberResource;
use App\Models\EmailSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmailSubscriberController extends Controller
{
    /**
     * List email subscribers (admin)
     *
     * Requires an admin account. Newest signups first. Filter with `search` (matches the email)
     * and `status` (subscribed|unsubscribed). Bare `{data, links, meta}` paginated envelope, same
     * shape as `Admin\AttemptController::index`.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = EmailSubscriber::query()->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where('email', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'subscribed') {
                $query->whereNull('unsubscribed_at');
            } elseif ($status === 'unsubscribed') {
                $query->whereNotNull('unsubscribed_at');
            }
        }

        $perPage = min(max($request->integer('per_page', 20), 5), 100);

        return EmailSubscriberResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Delete an email subscriber (admin)
     */
    public function destroy(EmailSubscriber $emailSubscriber): JsonResponse
    {
        $emailSubscriber->delete();

        return response()->json(['message' => __('Subscriber deleted.')]);
    }
}
