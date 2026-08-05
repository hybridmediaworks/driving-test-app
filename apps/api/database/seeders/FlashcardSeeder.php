<?php

namespace Database\Seeders;

use App\Models\Flashcard;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;

class FlashcardSeeder extends Seeder
{
    public function run(): void
    {
        $roadSigns = QuizCategory::query()->where('name', 'road-signs')->firstOrFail();
        $trafficLaws = QuizCategory::query()->where('name', 'traffic-laws')->firstOrFail();
        $california = State::query()->where('code', 'CA')->firstOrFail();
        $car = VehicleType::query()->where('name', 'car')->firstOrFail();

        $cards = [
            // Road-sign meanings are federally standardized (MUTCD) — deliberately left
            // state-agnostic AND vehicle-agnostic (state_id/vehicle_type_id null) rather than
            // pinned to California/car, matching the "nullable = applies universally" convention
            // documented on the flashcards table. A STOP sign means the same thing on a
            // motorcycle, in a car, or behind the wheel of a truck.
            [
                'category' => $roadSigns,
                'state' => null,
                'vehicle' => null,
                'front' => 'Red octagon sign',
                'back' => 'Stop. Come to a complete stop, yield to cross traffic and pedestrians, then proceed when safe.',
                'topic' => 'regulatory-signs',
                'premium' => false,
            ],
            [
                'category' => $roadSigns,
                'state' => null,
                'vehicle' => null,
                'front' => 'Red-bordered triangle, point down, reading "YIELD"',
                'back' => 'Slow down and be ready to stop if needed. Give the right of way to traffic and pedestrians already on the road.',
                'topic' => 'regulatory-signs',
                'premium' => false,
            ],
            [
                'category' => $roadSigns,
                'state' => null,
                'vehicle' => null,
                'front' => 'Diamond-shaped sign, yellow background',
                'back' => 'General warning about road conditions or hazards ahead — sharp curve, merging traffic, pedestrian crossing, etc.',
                'topic' => 'warning-signs',
                'premium' => true,
            ],
            [
                'category' => $roadSigns,
                'state' => null,
                'vehicle' => null,
                'front' => 'Round sign, orange background',
                'back' => 'Railroad crossing ahead. Slow down, look both ways, and be prepared to stop.',
                'topic' => 'warning-signs',
                'premium' => true,
            ],
            [
                'category' => $roadSigns,
                'state' => null,
                'vehicle' => null,
                'front' => 'Rectangular sign, green background',
                'back' => 'Directional or distance information — the next exit, a route number, or how far to a destination.',
                'topic' => 'guide-signs',
                'premium' => true,
            ],
            [
                'category' => $roadSigns,
                'state' => null,
                'vehicle' => null,
                'front' => 'Pentagon-shaped sign (five-sided, point up)',
                'back' => 'School zone ahead. Watch for children and reduce speed to the posted school-zone limit.',
                'topic' => 'warning-signs',
                'premium' => true,
            ],
            [
                'category' => $trafficLaws,
                'state' => $california,
                'vehicle' => $car,
                'front' => 'Solid yellow line on your side of the center line',
                'back' => 'Passing is not allowed from your side of the road.',
                'topic' => 'lane-markings',
                'premium' => true,
            ],
            [
                'category' => $trafficLaws,
                'state' => $california,
                'vehicle' => $car,
                'front' => 'School bus ahead has stopped with red lights flashing',
                'back' => 'Stop, regardless of direction of travel (unless separated by a median), and wait until the lights stop flashing.',
                'topic' => 'school-buses',
                'premium' => true,
            ],
        ];

        foreach ($cards as $index => $card) {
            Flashcard::query()->updateOrCreate(
                ['front_text' => $card['front']],
                [
                    'quiz_category_id' => $card['category']->id,
                    'state_id' => $card['state']?->id,
                    'vehicle_type_id' => $card['vehicle']?->id,
                    'back_text' => $card['back'],
                    'topic' => $card['topic'],
                    'is_premium' => $card['premium'],
                    'is_active' => true,
                    'sort_order' => $index,
                ],
            );
        }
    }
}
