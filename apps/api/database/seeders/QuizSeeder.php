<?php

namespace Database\Seeders;

use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $practiceType = QuizType::query()->where('name', 'practice')->firstOrFail();
        $california = State::query()->where('code', 'CA')->firstOrFail();
        $car = VehicleType::query()->where('name', 'car')->firstOrFail();

        $this->seedQuiz(
            title: 'California Traffic Laws Practice Test',
            categoryName: 'traffic-laws',
            quizType: $practiceType,
            state: $california,
            vehicleType: $car,
            questions: [
                [
                    'text' => 'When approaching an intersection with a four-way stop and another vehicle arrives at the same time from your right, who has the right of way?',
                    'topic' => 'right-of-way',
                    'answers' => [
                        ['text' => 'The vehicle on the right', 'correct' => true],
                        ['text' => 'The vehicle on the left'],
                        ['text' => 'Whichever vehicle is larger'],
                        ['text' => 'Whichever vehicle honks first'],
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
                    'text' => 'How far in advance should you signal before making a turn?',
                    'topic' => 'signaling',
                    'answers' => [
                        ['text' => 'At least 100 feet before the turn', 'correct' => true],
                        ['text' => 'Only after you start turning'],
                        ['text' => 'Signaling is optional in light traffic'],
                        ['text' => '10 feet before the turn'],
                    ],
                ],
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
                    'text' => 'When driving in fog, you should use your:',
                    'topic' => 'weather-conditions',
                    'answers' => [
                        ['text' => 'High-beam headlights'],
                        ['text' => 'Low-beam headlights', 'correct' => true],
                        ['text' => 'Hazard lights only'],
                        ['text' => 'Parking lights only'],
                    ],
                ],
            ],
        );

        $this->seedQuiz(
            title: 'California Road Signs Practice Test',
            categoryName: 'road-signs',
            quizType: $practiceType,
            state: $california,
            vehicleType: $car,
            questions: [
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
                    'text' => 'A diamond-shaped road sign with a yellow background generally indicates:',
                    'topic' => 'warning-signs',
                    'answers' => [
                        ['text' => 'A regulatory rule you must follow'],
                        ['text' => 'A general warning about road conditions ahead', 'correct' => true],
                        ['text' => 'A construction zone only'],
                        ['text' => 'A route marker'],
                    ],
                ],
                [
                    'text' => 'A round orange sign along the roadway most likely indicates:',
                    'topic' => 'warning-signs',
                    'answers' => [
                        ['text' => 'A railroad crossing ahead', 'correct' => true],
                        ['text' => 'A school zone'],
                        ['text' => 'A hospital nearby'],
                        ['text' => 'A rest area'],
                    ],
                ],
                [
                    'text' => 'What does a solid red octagon sign require you to do?',
                    'topic' => 'regulatory-signs',
                    'answers' => [
                        ['text' => 'Slow down only'],
                        ['text' => 'Come to a complete stop', 'correct' => true],
                        ['text' => 'Yield if traffic is present'],
                        ['text' => 'Stop only at night'],
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
            ],
        );
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
    ): void {
        $category = QuizCategory::query()->where('name', $categoryName)->firstOrFail();

        $quiz = Quiz::query()->updateOrCreate(
            ['slug' => Str::slug($title)],
            [
                'quiz_category_id' => $category->id,
                'quiz_type_id' => $quizType->id,
                'state_id' => $state->id,
                'vehicle_type_id' => $vehicleType->id,
                'title' => $title,
                'test_track' => 'permit_test',
                'order_no' => 0,
                'duration_seconds' => 1800,
                'is_premium' => false,
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
