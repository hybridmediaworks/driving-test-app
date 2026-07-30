<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            StateSeeder::class,
            VehicleTypeSeeder::class,
            QuizTypeSeeder::class,
            QuizCategorySeeder::class,
            UserSeeder::class,
            QuizSeeder::class,
            StateCoverageSeeder::class,
            FlashcardSeeder::class,
            CheatSheetSeeder::class,
            PlanSeeder::class,
        ]);
    }
}
