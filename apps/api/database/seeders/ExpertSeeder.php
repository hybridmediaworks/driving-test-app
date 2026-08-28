<?php

namespace Database\Seeders;

use App\Models\Expert;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ExpertSeeder extends Seeder
{
    public function run(): void
    {
        if (Expert::query()->exists()) {
            return;
        }

        Expert::query()->create([
            'slug' => 'marcus-reyes',
            'name' => 'Marcus Reyes',
            'title' => 'Lead DMV Content Reviewer, DriveLane',
            'credentials' => 'M.S., Lead DMV Content Reviewer (ACES member)',
            'role_label' => 'Reviewed for legal and handbook accuracy',
            'intro' => "Marcus oversees the editorial accuracy of DriveLane's permit-test question banks for cars, motorcycles, and commercial vehicles across all 50 states.\n\nHe has edited the majority of the questions currently in the bank, maintains the mapping between each question and its source handbook passage, and signs off on every state's content before it goes live.",
            'linkedin_url' => 'https://www.linkedin.com/company/drivelane',
            'email' => 'reviews@drivelane.test',
            'sections' => [
                [
                    'heading' => 'Areas of responsibility',
                    'body' => "- Editorial lead for car, motorcycle, and CDL practice tests\n- Question-to-handbook source mapping and citations\n- Annual U.S. driving-statistics refresh\n- Sign-off on new state coverage before publish",
                ],
                [
                    'heading' => 'Review methodology',
                    'body' => "Every question is checked against a single source of truth — the current official state driver's handbook, the MUTCD for signs and signals, and the relevant state traffic code.\n\nEach review pass runs: content diff against the previous handbook edition, source check on every answer, a plain-language clarity pass, a visual audit of any sign or diagram, and a final editor sign-off. The verification date on the badge is the most recent pass, not the last cosmetic edit.",
                ],
                [
                    'heading' => 'Editorial policy',
                    'body' => 'DriveLane is an independent study platform and is not affiliated with any state DMV. Official sources are monitored weekly; a reported error is investigated within 48 hours and, if confirmed, corrected in the next daily content build.',
                ],
                [
                    'heading' => 'Background',
                    'body' => 'Fifteen years in instructional design and technical editing, including standardized-test item writing and curriculum review for adult-education programs. Member of ACES: The Society for Editing.',
                ],
            ],
            'verified_at' => Carbon::now(),
            'sort_order' => 0,
            'is_published' => true,
        ]);

        Expert::query()->create([
            'slug' => 'dana-whitfield',
            'name' => 'Dana Whitfield',
            'title' => 'Head of Learning Experience, DriveLane',
            'credentials' => 'Head of Learning Experience, DriveLane',
            'role_label' => 'Test design and learning-experience oversight',
            'intro' => "Dana designs how DriveLane's practice tests are structured, sequenced, and scored so that time spent in the app maps as closely as possible to readiness for the real exam.",
            'linkedin_url' => null,
            'email' => null,
            'sections' => [
                [
                    'heading' => 'Areas of responsibility',
                    'body' => "- Practice-test structure, question sequencing, and pass thresholds\n- Exam-simulator format parity with each state's real test\n- The retest-your-misses and progress features\n- Accessibility and readability standards for questions and explanations",
                ],
                [
                    'heading' => 'Approach',
                    'body' => "Test format is matched to each state's official exam — question count, passing score, and the mix of topics. Explanations are written to teach the underlying rule, not just to justify the keyed answer, so a missed question improves the next attempt.",
                ],
            ],
            'verified_at' => Carbon::now(),
            'sort_order' => 1,
            'is_published' => true,
        ]);
    }
}
