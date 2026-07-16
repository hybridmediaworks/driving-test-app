<?php

namespace Database\Seeders;

use App\Models\QuizCategory;
use Illuminate\Database\Seeder;

class QuizCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['road-signs', 'Road Signs', 'Recognizing regulatory, warning, and guide signs.'],
            ['traffic-laws', 'Traffic Laws', 'Right of way, speed limits, and rules of the road.'],
            ['safe-driving', 'Safe Driving Practices', 'Defensive driving, hazard awareness, and vehicle control.'],
            ['alcohol-drugs', 'Alcohol & Drugs', 'BAC limits, implied consent, and impaired-driving law.'],
        ];

        foreach ($categories as $index => [$name, $title, $description]) {
            QuizCategory::query()->updateOrCreate(['name' => $name], [
                'title' => $title,
                'description' => $description,
                'order_no' => $index,
                'is_active' => true,
            ]);
        }
    }
}
