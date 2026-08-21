<?php

namespace Database\Seeders;

use App\Models\AmbientTrack;
use Illuminate\Database\Seeder;

class AmbientTrackSeeder extends Seeder
{
    /**
     * The 8 tracks that shipped as a hardcoded list before admin management existed. Seeded as
     * global (quiz_category_id null) so every quiz keeps seeing them, and at the same
     * `ambient-music/{slug}.mp3` S3 path already documented to whoever is uploading the files.
     * `url` resolves to null until that upload happens (or AWS_BUCKET is configured) — the
     * player already handles a null url by leaving the toggle on but silently not playing,
     * rather than a visible failure, so this is the quiet/inert placeholder state to seed with.
     */
    public function run(): void
    {
        $tracks = [
            'chasing-horizons' => 'Chasing Horizons',
            'quiet-streets' => 'Driving Through Quiet Streets',
            'smooth-lane-changes' => 'Smooth Lane Changes',
            'stay-in-your-lane' => 'Stay in Your Lane',
            'ready-to-ride' => 'Ready to Ride',
            'go-the-distance' => 'Go the Distance',
            'go-the-distance-2' => 'Go the Distance 2',
            'in-the-drivers-seat' => "In the Driver's Seat",
        ];

        $index = 0;
        foreach ($tracks as $slug => $title) {
            AmbientTrack::query()->updateOrCreate(['title' => $title], [
                'quiz_category_id' => null,
                'external_url' => null,
                'disk' => 's3',
                'path' => "ambient-music/{$slug}.mp3",
                'is_active' => true,
                'order_no' => $index++,
            ]);
        }
    }
}
