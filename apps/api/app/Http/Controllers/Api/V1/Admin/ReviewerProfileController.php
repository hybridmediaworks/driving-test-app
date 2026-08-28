<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateReviewerProfileRequest;
use App\Http\Resources\Api\V1\Admin\ReviewerProfileResource;
use App\Models\ReviewerProfile;
use Illuminate\Http\JsonResponse;

class ReviewerProfileController extends Controller
{
    /**
     * Show the reviewer profile (admin)
     *
     * Singleton — there's only ever one profile, so this takes no id. Requires an admin account.
     */
    public function show(): JsonResponse
    {
        return response()->json(['reviewer' => new ReviewerProfileResource(ReviewerProfile::current())]);
    }

    /**
     * Update the reviewer profile (admin)
     *
     * Singleton — updates the one existing profile (creating it first if somehow missing).
     * Multipart request (send as POST with `_method=PUT` when uploading a photo).
     * `remove_photo=1` clears the existing photo without uploading a new one.
     */
    public function update(UpdateReviewerProfileRequest $request): JsonResponse
    {
        $reviewer = ReviewerProfile::current();

        $data = $request->validated();
        unset($data['photo'], $data['remove_photo']);
        $reviewer->update($data);

        $newPhoto = $request->file('photo');
        if ($newPhoto !== null && $newPhoto->isValid()) {
            $reviewer->addMedia($newPhoto)->toMediaCollection(ReviewerProfile::MEDIA_COLLECTION_PHOTO);
        } elseif ($request->boolean('remove_photo')) {
            $reviewer->clearMediaCollection(ReviewerProfile::MEDIA_COLLECTION_PHOTO);
        }

        return response()->json(['reviewer' => new ReviewerProfileResource($reviewer->fresh())]);
    }
}
