<?php

namespace Database\Seeders;

use App\Models\ReviewerProfile;
use Illuminate\Database\Seeder;

class ReviewerProfileSeeder extends Seeder
{
    public function run(): void
    {
        if (ReviewerProfile::query()->exists()) {
            return;
        }

        ReviewerProfile::query()->create([
            'name' => 'M. Reyes',
            'title' => 'DMV Test-Prep Editor',
            'verified_at' => now(),
        ]);
    }
}
