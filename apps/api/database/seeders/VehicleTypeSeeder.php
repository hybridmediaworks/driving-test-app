<?php

namespace Database\Seeders;

use App\Models\VehicleType;
use Illuminate\Database\Seeder;

class VehicleTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['car', 'Car'],
            ['motorcycle', 'Motorcycle'],
            ['cdl', 'CDL (Commercial)'],
        ];

        foreach ($types as [$name, $title]) {
            VehicleType::query()->updateOrCreate(['name' => $name], ['title' => $title, 'is_active' => true]);
        }
    }
}
