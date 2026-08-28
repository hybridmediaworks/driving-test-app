<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Quiz\GenerateUniqueSlug;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreExpertRequest;
use App\Http\Requests\Api\V1\Admin\UpdateExpertRequest;
use App\Http\Resources\Api\V1\Admin\ExpertResource;
use App\Models\Expert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpertController extends Controller
{
    /**
     * List experts (admin)
     *
     * Requires an admin account. Paginated (standard `data`/`links`/`meta` envelope), in the same
     * display order the public trust block uses.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $experts = Expert::query()->ordered()->paginate($perPage)->withQueryString();

        return ExpertResource::collection($experts);
    }

    /**
     * Create an expert (admin)
     *
     * Multipart request (send as POST) when uploading a photo. A blank slug is derived from the
     * name and de-duplicated.
     */
    public function store(StoreExpertRequest $request, GenerateUniqueSlug $generateSlug): JsonResponse
    {
        $data = $this->normalise($request->validated());

        if (($data['slug'] ?? '') === '') {
            $data['slug'] = $generateSlug('experts', $data['name']);
        }

        $expert = Expert::query()->create($data);

        $this->syncPhoto($expert, $request);

        return response()->json(['expert' => new ExpertResource($expert->fresh())], 201);
    }

    /**
     * Show an expert (admin)
     */
    public function show(Expert $expert): JsonResponse
    {
        return response()->json(['expert' => new ExpertResource($expert)]);
    }

    /**
     * Update an expert (admin)
     *
     * Multipart request (send as POST with `_method=PUT`) when uploading a photo. `remove_photo=1`
     * clears the existing photo. The slug is left alone unless a new one is explicitly supplied —
     * changing it would break inbound links to the profile page.
     */
    public function update(UpdateExpertRequest $request, Expert $expert, GenerateUniqueSlug $generateSlug): JsonResponse
    {
        $data = $this->normalise($request->validated());

        if (($data['slug'] ?? '') === '') {
            unset($data['slug']);
        } else {
            $data['slug'] = $generateSlug('experts', $data['slug'], $expert->id);
        }

        $expert->update($data);

        $this->syncPhoto($expert, $request);

        return response()->json(['expert' => new ExpertResource($expert->fresh())]);
    }

    /**
     * Delete an expert (admin)
     */
    public function destroy(Expert $expert): JsonResponse
    {
        $expert->delete();

        return response()->json(['message' => __('Expert deleted.')]);
    }

    /**
     * Drop the non-column keys and coerce `sections` to a clean list of {heading, body}.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalise(array $data): array
    {
        unset($data['photo'], $data['remove_photo']);

        $data['sections'] = collect($data['sections'] ?? [])
            ->map(fn (array $section): array => [
                'heading' => trim((string) ($section['heading'] ?? '')),
                'body' => trim((string) ($section['body'] ?? '')),
            ])
            ->values()
            ->all();

        return $data;
    }

    private function syncPhoto(Expert $expert, Request $request): void
    {
        $newPhoto = $request->file('photo');

        if ($newPhoto !== null && $newPhoto->isValid()) {
            $expert->addMedia($newPhoto)->toMediaCollection(Expert::MEDIA_COLLECTION_PHOTO);
        } elseif ($request->boolean('remove_photo')) {
            $expert->clearMediaCollection(Expert::MEDIA_COLLECTION_PHOTO);
        }
    }
}
