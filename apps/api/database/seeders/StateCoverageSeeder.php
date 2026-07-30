<?php

namespace Database\Seeders;

use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Gives every state a minimal, real (non-empty) `/[state]` landing page for the `car` vehicle
 * type, so the "Essentials / more complicated stuff / things that could get you in trouble /
 * extra support / exam simulator" sections render real quizzes instead of the frontend's
 * empty-state everywhere except California. Question content is a nationwide-generic stopgap
 * (road-sign meanings, right-of-way, BAC limits, etc. are consistent across most states) pending
 * real per-state content authored via the admin panel. Motorcycle/CDL coverage is a follow-up.
 */
class StateCoverageSeeder extends Seeder
{
    /** @var array<string, list<array{text: string, topic: string, answers: list<array{text: string, correct?: bool}>}>> */
    private array $questionBanks = [
        'the-essentials' => [
            [
                'text' => 'A solid red octagon sign means you must:',
                'topic' => 'regulatory-signs',
                'answers' => [
                    ['text' => 'Come to a complete stop', 'correct' => true],
                    ['text' => 'Slow down only'],
                    ['text' => 'Yield if traffic is present'],
                    ['text' => 'Stop only at night'],
                ],
            ],
            [
                'text' => 'Unless otherwise posted, what is the typical speed limit in a residential district?',
                'topic' => 'speed-limits',
                'answers' => [
                    ['text' => '15 mph'],
                    ['text' => '25 mph', 'correct' => true],
                    ['text' => '35 mph'],
                    ['text' => '45 mph'],
                ],
            ],
            [
                'text' => 'Seat belts are required for:',
                'topic' => 'vehicle-safety',
                'answers' => [
                    ['text' => 'The driver only'],
                    ['text' => 'The driver and all passengers', 'correct' => true],
                    ['text' => 'Only front-seat occupants'],
                    ['text' => 'Only on highways'],
                ],
            ],
            [
                'text' => 'A triangular sign with a red border and the word "YIELD" means you must:',
                'topic' => 'regulatory-signs',
                'answers' => [
                    ['text' => 'Stop completely, always'],
                    ['text' => 'Slow down and give the right of way to traffic and pedestrians as needed', 'correct' => true],
                    ['text' => 'Speed up to merge quickly'],
                    ['text' => 'Ignore it if no other cars are visible'],
                ],
            ],
            [
                'text' => 'How far in advance should you signal before making a turn?',
                'topic' => 'signaling',
                'answers' => [
                    ['text' => 'At least 100 feet before the turn', 'correct' => true],
                    ['text' => 'Only after you start turning'],
                    ['text' => 'Signaling is optional in light traffic'],
                    ['text' => '10 feet before the turn'],
                ],
            ],
        ],
        'the-more-complicated-stuff' => [
            [
                'text' => 'At a four-way stop, when two vehicles arrive at the same time, who has the right of way?',
                'topic' => 'right-of-way',
                'answers' => [
                    ['text' => 'The vehicle on the right', 'correct' => true],
                    ['text' => 'The vehicle on the left'],
                    ['text' => 'Whichever vehicle is larger'],
                    ['text' => 'Whichever vehicle honks first'],
                ],
            ],
            [
                'text' => 'What does a solid yellow line on your side of the center line mean?',
                'topic' => 'lane-markings',
                'answers' => [
                    ['text' => 'Passing is not allowed from your side', 'correct' => true],
                    ['text' => 'Passing is allowed at any time'],
                    ['text' => 'The lane is closed ahead'],
                    ['text' => 'You must merge left immediately'],
                ],
            ],
            [
                'text' => 'When is it legal to pass another vehicle on the right?',
                'topic' => 'passing',
                'answers' => [
                    ['text' => 'Never, under any circumstance'],
                    ['text' => 'On a multi-lane road where the movement can be made safely', 'correct' => true],
                    ['text' => 'Only on freeways'],
                    ['text' => 'Only at night'],
                ],
            ],
            [
                'text' => 'A sign showing a black arrow curving on a white background typically warns of:',
                'topic' => 'warning-signs',
                'answers' => [
                    ['text' => 'A winding road ahead', 'correct' => true],
                    ['text' => 'A dead end'],
                    ['text' => 'A one-way street'],
                    ['text' => 'A speed bump'],
                ],
            ],
        ],
        'things-that-could-get-you-in-trouble' => [
            [
                'text' => 'What is the legal blood alcohol concentration (BAC) limit for drivers 21 and older in most states?',
                'topic' => 'impaired-driving',
                'answers' => [
                    ['text' => '0.08%', 'correct' => true],
                    ['text' => '0.05%'],
                    ['text' => '0.10%'],
                    ['text' => '0.02%'],
                ],
            ],
            [
                'text' => 'What should you do when a school bus ahead of you on your side of the road stops with red lights flashing?',
                'topic' => 'school-buses',
                'answers' => [
                    ['text' => 'Slow down and pass carefully'],
                    ['text' => 'Stop and wait until the lights stop flashing', 'correct' => true],
                    ['text' => 'Honk and proceed'],
                    ['text' => 'Only stop if children are visible'],
                ],
            ],
            [
                'text' => 'Texting while driving is:',
                'topic' => 'distracted-driving',
                'answers' => [
                    ['text' => 'Illegal in most states while the vehicle is in motion', 'correct' => true],
                    ['text' => 'Always legal'],
                    ['text' => 'Only illegal for new drivers'],
                    ['text' => 'Only illegal on highways'],
                ],
            ],
        ],
        'the-extra-support' => [
            [
                'text' => 'When driving in fog, you should use your:',
                'topic' => 'weather-conditions',
                'answers' => [
                    ['text' => 'High-beam headlights'],
                    ['text' => 'Low-beam headlights', 'correct' => true],
                    ['text' => 'Hazard lights only'],
                    ['text' => 'Parking lights only'],
                ],
            ],
            [
                'text' => 'Signs with a green background are generally used to display:',
                'topic' => 'guide-signs',
                'answers' => [
                    ['text' => 'Directional and distance information', 'correct' => true],
                    ['text' => 'Construction warnings'],
                    ['text' => 'Speed limits only'],
                    ['text' => 'Parking restrictions'],
                ],
            ],
            [
                'text' => 'If your vehicle begins to hydroplane, you should:',
                'topic' => 'vehicle-control',
                'answers' => [
                    ['text' => 'Ease off the accelerator and steer straight', 'correct' => true],
                    ['text' => 'Brake hard immediately'],
                    ['text' => 'Accelerate to regain traction'],
                    ['text' => 'Turn sharply toward the shoulder'],
                ],
            ],
        ],
    ];

    /** @var array<string, string> */
    private array $quizTitles = [
        'the-essentials' => 'Essentials',
        'the-more-complicated-stuff' => 'Complex Scenarios',
        'things-that-could-get-you-in-trouble' => 'Violations & Penalties',
        'the-extra-support' => 'Extra Support',
    ];

    public function run(): void
    {
        $practiceType = QuizType::query()->where('name', 'practice')->firstOrFail();
        $finalType = QuizType::query()->where('name', 'final')->firstOrFail();
        $car = VehicleType::query()->where('name', 'car')->firstOrFail();

        State::query()->orderBy('code')->each(function (State $state) use ($practiceType, $finalType, $car) {
            foreach ($this->questionBanks as $categoryName => $questions) {
                $this->seedQuiz(
                    title: "{$state->name} {$this->quizTitles[$categoryName]} Practice Test",
                    categoryName: $categoryName,
                    quizType: $practiceType,
                    state: $state,
                    vehicleType: $car,
                    questions: $questions,
                );
            }

            $this->seedQuiz(
                title: "{$state->name} DMV Exam Simulation",
                categoryName: 'traffic-laws',
                quizType: $finalType,
                state: $state,
                vehicleType: $car,
                questions: array_merge(...array_values($this->questionBanks)),
                durationSeconds: 600,
                passingScorePercent: 80,
                isPremium: true,
            );
        });
    }

    /**
     * @param  list<array{text: string, topic: string, answers: list<array{text: string, correct?: bool}>}>  $questions
     */
    private function seedQuiz(
        string $title,
        string $categoryName,
        QuizType $quizType,
        State $state,
        VehicleType $vehicleType,
        array $questions,
        int $durationSeconds = 1800,
        ?int $passingScorePercent = null,
        bool $isPremium = false,
    ): void {
        $category = QuizCategory::query()->where('name', $categoryName)->firstOrFail();
        $slug = Str::slug("{$state->code} {$title}");

        $quiz = Quiz::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'quiz_category_id' => $category->id,
                'quiz_type_id' => $quizType->id,
                'state_id' => $state->id,
                'vehicle_type_id' => $vehicleType->id,
                'title' => $title,
                'test_track' => 'permit_test',
                'order_no' => 0,
                'duration_seconds' => $durationSeconds,
                'passing_score_percent' => $passingScorePercent,
                'is_premium' => $isPremium,
                'is_active' => true,
            ],
        );

        $quiz->quizQuestions()->delete();

        foreach ($questions as $index => $row) {
            $question = $quiz->quizQuestions()->create([
                'question_text' => $row['text'],
                'topic' => $row['topic'],
                'difficulty' => 'medium',
                'sort_order' => $index,
            ]);

            foreach ($row['answers'] as $answerIndex => $answer) {
                $question->answers()->create([
                    'answer_text' => $answer['text'],
                    'is_correct' => $answer['correct'] ?? false,
                    'sort_order' => $answerIndex,
                ]);
            }
        }

        $quiz->syncTotalQuestions();
    }
}
