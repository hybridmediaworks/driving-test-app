<?php

namespace Database\Seeders;

use App\Models\CheatSheet;
use App\Models\QuizCategory;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CheatSheetSeeder extends Seeder
{
    public function run(): void
    {
        $trafficLaws = QuizCategory::query()->where('name', 'traffic-laws')->firstOrFail();
        $roadSigns = QuizCategory::query()->where('name', 'road-signs')->firstOrFail();
        $california = State::query()->where('code', 'CA')->firstOrFail();
        $car = VehicleType::query()->where('name', 'car')->firstOrFail();

        $this->seedSheet(
            title: 'Right-of-Way Quick Reference',
            category: $trafficLaws,
            state: $california,
            vehicleType: $car,
            summary: 'The right-of-way rules that trip people up most — four-way stops, uncontrolled intersections, and pedestrians.',
            isPremium: false, // kept free as a teaser, per the access-matrix design (~1 free sheet per state/category)
            sections: [
                [
                    'heading' => 'Four-way stops',
                    'body' => "- The first vehicle to stop goes first.\n- If two vehicles arrive at the same time, the vehicle on the **right** goes first.\n- If a vehicle is turning left and another is going straight and both arrive together, the straight-through vehicle usually goes first.",
                ],
                [
                    'heading' => 'Uncontrolled intersections (no signs or signals)',
                    'body' => "- Yield to the vehicle on your right if you arrive at the same time.\n- Yield to any vehicle already in the intersection.",
                ],
                [
                    'heading' => 'Pedestrians',
                    'body' => "- Pedestrians in a crosswalk (marked or unmarked) always have the right of way.\n- Stop for pedestrians even if they're not yet in your lane, if they're clearly about to cross.",
                ],
            ],
        );

        $this->seedSheet(
            title: 'Road Sign Shapes & Colors',
            category: $roadSigns,
            state: null, // federally standardized (MUTCD) — applies everywhere, not just CA
            vehicleType: null,
            summary: 'What a sign\'s shape and color mean before you even read the words on it.',
            isPremium: true,
            sections: [
                [
                    'heading' => 'Shapes',
                    'body' => "- **Octagon** — stop\n- **Triangle (point down)** — yield\n- **Diamond** — warning\n- **Pentagon** — school zone\n- **Round** — railroad crossing\n- **Rectangle** — regulatory or guide information",
                ],
                [
                    'heading' => 'Colors',
                    'body' => "- **Red** — stop, yield, prohibition\n- **Yellow** — general warning\n- **Orange** — construction/temporary conditions\n- **Green** — guide/directional information\n- **Blue** — services (hospital, rest area)\n- **Brown** — recreational/cultural interest",
                ],
            ],
        );

        $this->seedSheet(
            title: 'Top Trickiest Questions',
            category: $trafficLaws,
            state: $california,
            vehicleType: $car,
            summary: 'The specific questions our data shows people get wrong most often, explained in plain English.',
            isPremium: true,
            sections: [
                [
                    'heading' => 'Blood alcohol concentration (BAC) limits',
                    'body' => "The legal limit is **0.08%** for drivers 21+. It's lower for commercial drivers (0.04%) and zero-tolerance (0.01% or 0.00% depending on state) for drivers under 21.",
                ],
                [
                    'heading' => 'Solid vs. broken yellow lines',
                    'body' => "A solid yellow line on **your side** means no passing from your side. A broken yellow line means passing is allowed **when safe**. Double solid yellow means no passing from either side.",
                ],
                [
                    'heading' => 'School bus stops',
                    'body' => "Stop for a school bus with flashing red lights **regardless of direction of travel**, unless you're on the opposite side of a divided highway with a physical median.",
                ],
            ],
        );
    }

    /**
     * @param  list<array{heading: string, body: string}>  $sections
     */
    private function seedSheet(
        string $title,
        QuizCategory $category,
        ?State $state,
        ?VehicleType $vehicleType,
        string $summary,
        bool $isPremium,
        array $sections,
    ): void {
        $cheatSheet = CheatSheet::query()->updateOrCreate(
            ['slug' => Str::slug($title)],
            [
                'quiz_category_id' => $category->id,
                'state_id' => $state?->id,
                'vehicle_type_id' => $vehicleType?->id,
                'title' => $title,
                'summary' => $summary,
                'is_premium' => $isPremium,
                'is_active' => true,
                'order_no' => 0,
            ],
        );

        $cheatSheet->sections()->delete();

        foreach ($sections as $index => $section) {
            $cheatSheet->sections()->create([
                'heading' => $section['heading'],
                'body_markdown' => $section['body'],
                'sort_order' => $index,
            ]);
        }
    }
}
