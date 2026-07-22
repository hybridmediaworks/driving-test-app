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
            ['the-essentials', 'The Essentials', 'Your journey begins here. These tests cover key concepts and essential knowledge.'],
            ['the-more-complicated-stuff', 'The more complicated stuff', 'Master complex driving scenarios and tricky road signs.'],
            ['things-that-could-get-you-in-trouble', 'The things that could get you in trouble', 'Avoid fines and penalties by mastering critical rules.'],
            ['the-extra-support', 'The extra support', 'Downloadable guides to keep your knowledge fresh.'],
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
