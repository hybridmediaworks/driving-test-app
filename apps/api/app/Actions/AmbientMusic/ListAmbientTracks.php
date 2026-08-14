<?php

namespace App\Actions\AmbientMusic;

use App\Models\AmbientTrack;

class ListAmbientTracks
{
    /**
     * Active background-music loops for the quiz Settings panel, admin-managed and optionally
     * scoped to a quiz category. When a category name is given, returns tracks tagged to that
     * category plus every "global" track (quiz_category_id null) — global tracks always show
     * regardless of category. When omitted, returns every active track unfiltered.
     *
     * @return list<array{id: int, title: string, url: string|null}>
     */
    public function __invoke(?string $categoryName): array
    {
        $query = AmbientTrack::query()
            ->where('is_active', true)
            ->orderBy('order_no')
            ->orderBy('title');

        if ($categoryName !== null) {
            $query->where(
                fn ($q) => $q->whereNull('quiz_category_id')
                    ->orWhereHas('category', fn ($c) => $c->where('name', $categoryName)),
            );
        }

        return $query->get()
            ->map(fn (AmbientTrack $track): array => [
                'id' => $track->id,
                'title' => $track->title,
                'url' => $track->url,
            ])
            ->all();
    }
}
