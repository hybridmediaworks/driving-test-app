<?php

namespace Database\Seeders;

use App\Models\QuizType;
use Illuminate\Database\Seeder;

class QuizTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['practice', 'Practice Test'],
            ['final', 'Final Exam Simulation'],
        ];

        foreach ($types as [$name, $title]) {
            QuizType::query()->updateOrCreate(['name' => $name], ['title' => $title]);
        }
    }
}
