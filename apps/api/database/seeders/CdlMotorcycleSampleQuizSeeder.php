<?php

namespace Database\Seeders;

use App\Models\Quiz;
use App\Models\QuizCategory;
use App\Models\QuizType;
use App\Models\State;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CdlMotorcycleSampleQuizSeeder extends Seeder
{
    private const STATES = ['AL', 'AR'];

    private const CATEGORIES = [
        'the-essentials' => ['The Essentials', 0],
        'the-more-complicated-stuff' => ['The more complicated stuff', 1],
        'things-that-could-get-you-in-trouble' => ['The things that could get you in trouble', 2],
        'traffic-laws' => ['Traffic Laws', 0],
        'general-knowledge' => ['General Knowledge', 0],
        'hazardous-materials-hazmat' => ['Hazardous Materials (HazMat)', 1],
        'air-brakes' => ['Air Brakes', 2],
    ];

    public function run(): void
    {
        $quizTypes = QuizType::query()->pluck('id', 'name');
        $vehicleIds = VehicleType::query()->pluck('id', 'name');
        $categoryIds = collect(self::CATEGORIES)->map(fn (array $category, string $name) => QuizCategory::query()->firstOrCreate(
            ['name' => $name],
            ['title' => $category[0], 'order_no' => $category[1], 'is_active' => true],
        )->id);

        foreach (State::query()->whereIn('code', self::STATES)->get() as $state) {
            foreach ($this->quizzes() as $vehicle => $quizzes) {
                foreach ($quizzes as $order => $definition) {
                    DB::transaction(fn () => $this->seedQuiz(
                        $definition,
                        $order,
                        $state,
                        $vehicleIds[$vehicle],
                        $categoryIds[$definition['category']],
                        $quizTypes[$definition['exam'] ? 'final' : 'practice'],
                    ));
                }
            }
        }
    }

    private function seedQuiz(array $definition, int $order, State $state, int $vehicleTypeId, int $categoryId, int $quizTypeId): void
    {
        $title = "{$state->name} {$definition['title']}";

        $quiz = Quiz::query()->updateOrCreate(['slug' => Str::slug($title)], [
            'quiz_category_id' => $categoryId,
            'quiz_type_id' => $quizTypeId,
            'state_id' => $state->id,
            'vehicle_type_id' => $vehicleTypeId,
            'title' => $title,
            'order_no' => $order,
            'test_track' => 'permit_test',
            'total_questions' => count($definition['questions']),
            'duration_seconds' => $definition['exam'] ? 600 : 1800,
            'passing_score_percent' => $definition['exam'] ? 80 : null,
            'is_premium' => $definition['premium'],
            'is_active' => true,
        ]);

        if ($quiz->quizQuestions()->exists()) {
            return;
        }

        foreach ($definition['questions'] as $index => [$text, $options, $explanation]) {
            $question = $quiz->quizQuestions()->create([
                'question_text' => $text,
                'explanation' => $explanation,
                'difficulty' => 'medium',
                'sort_order' => $index + 1,
            ]);

            $correctAt = $index % count($options);
            $ordered = array_values(array_merge(array_slice($options, 1, $correctAt), [$options[0]], array_slice($options, $correctAt + 1)));

            foreach ($ordered as $position => $answer) {
                $question->answers()->create([
                    'answer_text' => $answer,
                    'is_correct' => $answer === $options[0],
                    'sort_order' => $position,
                ]);
            }
        }
    }

    private function quizzes(): array
    {
        return [
            'motorcycle' => [
                [
                    'title' => 'Motorcycle Essentials Practice Test',
                    'category' => 'the-essentials',
                    'premium' => false,
                    'exam' => false,
                    'questions' => [
                        ['What is the most important piece of protective gear for a motorcyclist?', ['A DOT-compliant helmet', 'A leather jacket', 'Riding gloves', 'Over-the-ankle boots'], 'Head injuries cause the majority of motorcycle crash deaths. A DOT-compliant helmet is the single most effective piece of gear.'],
                        ['When should you wear eye protection while riding?', ['At all times, even if the motorcycle has a windshield', 'Only at highway speeds', 'Only when it is raining', 'Only if the motorcycle has no windshield'], 'A windshield does not protect your eyes from wind, dust, rain or insects. Wear a face shield or goggles every ride.'],
                        ['How do you make the quickest stop on a straight, dry road?', ['Use both the front and rear brakes at the same time', 'Use only the rear brake', 'Use only the front brake', 'Downshift without using the brakes'], 'The front brake provides most of your stopping power, but using both brakes together gives the shortest, most controlled stop.'],
                        ['Which items should you check before every ride?', ['Tires, brakes, lights and controls', 'Only the fuel level', 'Only the oil level', 'Nothing, if the motorcycle ran fine the day before'], 'A quick pre-ride check of tires, controls, lights, oil, chassis and stands (T-CLOCS) catches problems before they cause a crash.'],
                        ['What is the best way to make yourself more visible to other drivers during the day?', ['Ride with your headlight on', 'Wear dark-colored clothing', 'Ride close to the vehicle ahead', 'Flash your brake light constantly'], 'A headlight on during the day, plus brightly colored clothing, makes a motorcycle much easier to notice.'],
                    ],
                ],
                [
                    'title' => 'Motorcycle Riding Techniques Practice Test',
                    'category' => 'the-more-complicated-stuff',
                    'premium' => false,
                    'exam' => false,
                    'questions' => [
                        ['To turn a motorcycle at speeds above walking pace, you should:', ['Press the handgrip on the side of the direction you want to turn', 'Turn the handlebars away from the turn and lean back', 'Shift your weight without any steering input', 'Use the rear brake to pivot the motorcycle'], 'This is countersteering: press left to go left, press right to go right. It makes the motorcycle lean and turn.'],
                        ['When should you slow down for a curve?', ['Before you enter the curve', 'In the middle of the curve', 'As you exit the curve', 'Only if the road is wet'], 'Adjust your speed before the curve so you can roll on the throttle smoothly through it. Braking mid-curve can upset the motorcycle.'],
                        ['What is the minimum recommended following distance behind another vehicle?', ['Two seconds', 'Half a second', 'One car length', 'Ten feet'], 'Keep at least a two-second gap, and more in bad weather or heavy traffic, so you have time to react.'],
                        ['When carrying a passenger, the passenger should:', ['Keep both feet on the footrests at all times, even when stopped', 'Lean opposite to you in turns', 'Put their feet down at every stop', 'Hold on only to the rear luggage rack'], 'A passenger who keeps their feet on the footrests and leans with the rider helps keep the motorcycle stable.'],
                        ['If your front tire goes flat while you are riding, you should:', ['Hold the handgrips firmly, ease off the throttle and keep a straight course', 'Brake hard with the front brake', 'Shift your weight toward the front', 'Accelerate to keep your balance'], 'Avoid braking with the flat tire. Steer straight, close the throttle gradually and pull off the road when it is safe.'],
                    ],
                ],
                [
                    'title' => 'Motorcycle Hazards & Group Riding Practice Test',
                    'category' => 'things-that-could-get-you-in-trouble',
                    'premium' => false,
                    'exam' => false,
                    'questions' => [
                        ['When riding in a group, the best formation is usually:', ['A staggered formation', 'Side-by-side pairs in one lane', 'A single tight line with no gaps', 'All riders in the center of the lane'], 'A staggered formation keeps the group close together while giving each rider space to maneuver.'],
                        ['When crossing railroad tracks that run diagonally across the road, you should:', ['Cross at an angle of at least 45 degrees', 'Ride parallel to the tracks', 'Brake while you are on the tracks', 'Ride along the edge of the tracks'], 'Crossing at a wide angle keeps your tires from being caught in the gap next to the rails.'],
                        ['If a small animal runs into your path, you should:', ['Stay in your lane and slow down, without swerving into other traffic', 'Swerve sharply to avoid it', 'Kick at the animal', 'Speed up and pass in front of it'], 'Swerving into another lane or off the road is usually more dangerous than slowing down in your own lane.'],
                        ['To ride over an object in the road you cannot avoid, you should:', ['Rise slightly off the seat with knees bent and keep the motorcycle straight', 'Lean the motorcycle hard to one side', 'Brake hard while going over it', 'Close your eyes and hold your breath'], 'Rising off the seat lets your legs absorb the shock, and a straight motorcycle is less likely to lose traction.'],
                        ['How does alcohol affect your riding?', ['It slows your reactions and impairs your judgment and balance', 'It improves your concentration', 'It only affects you after five or more drinks', 'It has no effect if you ride slowly'], 'Even small amounts of alcohol reduce the skills riding demands most: balance, judgment and quick reactions.'],
                    ],
                ],
                [
                    'title' => 'Motorcycle Exam Simulation',
                    'category' => 'traffic-laws',
                    'premium' => true,
                    'exam' => true,
                    'questions' => [
                        ['Where are motorcycles most likely to be involved in a collision with a car?', ['At intersections', 'On straight highways', 'In parking garages', 'On one-way streets'], 'Most motorcycle–car crashes happen at intersections, often when a car turns left in front of a motorcycle.'],
                        ['The SEE strategy for safe riding stands for:', ['Search, Evaluate, Execute', 'Stop, Engage, Exit', 'Signal, Enter, Exit', 'Slow, Evaluate, Escape'], 'Search for hazards, Evaluate how they could affect you, and Execute your decision.'],
                        ['When you come to a stop, which foot should you put down first?', ['Your left foot, keeping your right foot on the rear brake', 'Your right foot', 'Both feet at the same time', 'Neither foot until the engine is off'], 'Keeping your right foot on the rear brake holds the motorcycle steady while you are stopped.'],
                        ['When should you increase your following distance?', ['On slippery roads or when following large vehicles', 'Only at night', 'Only in town', 'Never; two seconds is always enough'], 'Slippery surfaces lengthen stopping distances, and large vehicles block your view of the road ahead.'],
                        ['A common cause of single-vehicle motorcycle crashes is:', ['Running wide in a curve or turn', 'Using turn signals', 'Wearing a helmet', 'Riding with the headlight on'], 'Riders who enter a curve too fast or look in the wrong place often run wide into another lane or off the road.'],
                        ['To reduce your reaction time, you should:', ['Cover the clutch and the brakes', 'Ride with both feet off the footrests', 'Keep your hands off the controls', 'Ride in the highest gear possible'], 'Covering the controls lets you respond the moment a hazard appears.'],
                        ['If your throttle sticks and twisting it back and forth does not free it, you should:', ['Use the engine cut-off switch and pull in the clutch', 'Shift into neutral and keep accelerating', 'Jump off the motorcycle', 'Brake with only the rear brake'], 'The engine cut-off switch stops the engine, and pulling in the clutch removes power from the rear wheel.'],
                        ['Wearing brightly colored clothing helps you:', ['Be seen by other drivers', 'Stay cooler in hot weather', 'Ride faster', 'Meet a legal requirement in every state'], 'Bright and reflective clothing makes a rider much easier to see, especially from the front and side.'],
                    ],
                ],
            ],
            'cdl' => [
                [
                    'title' => 'CDL General Knowledge Practice Test',
                    'category' => 'general-knowledge',
                    'premium' => false,
                    'exam' => false,
                    'questions' => [
                        ['When should you do a vehicle inspection?', ['Before every trip, as required by federal and state law', 'Once a week', 'Only after an accident', 'Only when a light comes on'], 'Federal and state laws require drivers to inspect their vehicles before every trip.'],
                        ['How far ahead should you look while driving a commercial vehicle?', ['12 to 15 seconds ahead', '2 to 3 seconds ahead', 'Only as far as the vehicle in front', 'One block ahead in all conditions'], 'Looking 12 to 15 seconds ahead gives you time to spot hazards and change lanes or slow down early.'],
                        ['Most serious skids result from:', ['Driving too fast for road conditions', 'Using cruise control', 'Driving with an empty trailer', 'Using the engine brake'], 'Drivers who adjust their speed to conditions rarely need to make the sudden moves that cause serious skids.'],
                        ['Hydroplaning is most likely when:', ['Tire pressure is low or tread is worn and there is standing water', 'The road is dry and hot', 'You drive below 20 mph', 'The trailer is fully loaded'], 'Low pressure or worn tread lets water lift the tire off the road, especially on standing water.'],
                        ['If you stop on a divided or one-way highway, where should you place your warning devices?', ['10, 100 and 200 feet toward approaching traffic', 'One device directly behind the vehicle', '50 feet in front and 50 feet behind', 'There is no need to place them'], 'On a one-way or divided highway, place warning devices 10, 100 and 200 feet toward the traffic coming up behind you.'],
                    ],
                ],
                [
                    'title' => 'CDL Air Brakes Practice Test',
                    'category' => 'air-brakes',
                    'premium' => false,
                    'exam' => false,
                    'questions' => [
                        ['Air brakes are made up of which three braking systems?', ['Service, parking and emergency', 'Front, rear and trailer', 'Hydraulic, electric and air', 'Engine, exhaust and wheel'], 'The service brakes slow you down, the parking brakes hold the vehicle, and the emergency system stops it if the service system fails.'],
                        ['The low air pressure warning must come on before the pressure in the service tanks falls below:', ['60 psi', '20 psi', '100 psi', '125 psi'], 'The warning signal must activate before air pressure drops below 60 psi, giving you time to stop safely.'],
                        ['What does the air compressor governor control?', ['When the compressor pumps air into the storage tanks', 'How hard the brakes are applied', 'The speed of the engine', 'When the spring brakes release'], 'The governor stops the compressor at cut-out pressure (around 125 psi) and restarts it at cut-in pressure.'],
                        ['Why should you drain water from compressed air tanks?', ['Water and oil can freeze in cold weather and cause the brakes to fail', 'To make the tanks lighter', 'To clean the air compressor', 'It is not necessary in modern vehicles'], 'Water and oil collect in the tanks and can freeze or damage the system, causing brake failure.'],
                        ['With the engine off and the parking brake released, a single vehicle\'s air pressure should not drop more than:', ['2 psi in one minute', '10 psi in one minute', '20 psi in one minute', '1 psi in ten minutes'], 'A drop of more than 2 psi per minute (3 psi for combination vehicles) means the system has a leak.'],
                    ],
                ],
                [
                    'title' => 'CDL HazMat Basics Practice Test',
                    'category' => 'hazardous-materials-hazmat',
                    'premium' => false,
                    'exam' => false,
                    'questions' => [
                        ['Who is responsible for packaging, labeling and preparing shipping papers for hazardous materials?', ['The shipper', 'The driver', 'The receiver', 'The police'], 'The shipper prepares the papers and packaging. The carrier and driver are responsible for transporting the load safely.'],
                        ['While you are driving, hazardous materials shipping papers must be kept:', ['Within your reach with your seat belt on, or in a pouch on the driver\'s door', 'In the trailer with the cargo', 'In the glove box', 'At the shipper\'s office'], 'Emergency responders need to find the papers quickly, so they must be in reach or in the driver\'s door pouch.'],
                        ['How many placards does a placarded vehicle need?', ['At least four: one on each side and each end', 'One on the front', 'Two, one on each side', 'None, if the shipping papers are correct'], 'Placards must be readable from all four directions, so they go on the front, back and both sides.'],
                        ['A material\'s hazard class tells you:', ['The risks associated with it', 'Who shipped it', 'How much it costs', 'Where it is going'], 'Hazard classes group materials by their dangers, such as explosives, flammable liquids or poisons.'],
                        ['You need a HazMat endorsement to transport:', ['Hazardous materials in amounts that require placards', 'Any cargo over 10,000 pounds', 'Empty tanker trailers only', 'Passengers'], 'A HazMat endorsement is required whenever the material or quantity you haul requires placards.'],
                    ],
                ],
                [
                    'title' => 'CDL HazMat Placards & Loading Practice Test',
                    'category' => 'hazardous-materials-hazmat',
                    'premium' => false,
                    'exam' => false,
                    'questions' => [
                        ['When loading or unloading Class 1 (explosives), you must not smoke within:', ['25 feet', '5 feet', '10 feet', '100 feet'], 'Do not smoke within 25 feet when loading or unloading explosives, flammable liquids, flammable solids or oxidizers.'],
                        ['You may not park a vehicle placarded for Division 1.1, 1.2 or 1.3 explosives within ___ of the traveled part of the road.', ['5 feet', '1 foot', '15 feet', '50 feet'], 'Vehicles carrying these explosives must not be parked within 5 feet of the traveled part of the road.'],
                        ['Placards must be placed so they can be read from:', ['All four directions', 'The front only', 'The rear only', 'The driver\'s side only'], 'Placards on all four sides let emergency responders identify the hazard from any direction.'],
                        ['A placarded vehicle must stop before a railroad crossing at a distance of:', ['15 to 50 feet from the nearest rail', '5 to 10 feet', '100 to 200 feet', 'It does not have to stop'], 'Stop between 15 and 50 feet from the nearest rail, then look and listen before crossing.'],
                        ['The Emergency Response Guidebook (ERG) is used by:', ['Firefighters, police and other emergency responders', 'Shippers to price their loads', 'Drivers to plan their routes', 'Mechanics to repair tankers'], 'The ERG helps emergency responders identify hazardous materials and decide how to protect the public.'],
                    ],
                ],
                [
                    'title' => 'CDL Exam Simulation',
                    'category' => 'general-knowledge',
                    'premium' => true,
                    'exam' => true,
                    'questions' => [
                        ['When driving in fog, you should:', ['Use your low beams and fog lights', 'Use your high beams', 'Turn off your headlights', 'Follow closely behind the vehicle ahead'], 'High beams reflect off fog and reduce what you can see. Low beams and fog lights work best.'],
                        ['If your brakes fail on a downgrade, you should look for:', ['An escape ramp', 'A rest area', 'A gas station', 'An exit with a traffic light'], 'Escape ramps are built to stop runaway vehicles safely. Use one if your brakes fail.'],
                        ['On a long downgrade, the proper braking technique is to:', ['Brake until you are 5 mph below your safe speed, release, and repeat', 'Ride the brakes all the way down', 'Shift into neutral to save fuel', 'Brake only at the bottom of the hill'], 'Snub braking keeps your brakes from overheating and fading on long grades.'],
                        ['When driving at night, you should:', ['Drive at a speed that lets you stop within the distance you can see', 'Use your high beams in all traffic', 'Drive faster to finish your trip sooner', 'Look directly at oncoming headlights'], 'Overdriving your headlights means you cannot stop in time for a hazard you suddenly see.'],
                        ['After 10 consecutive hours off duty, a property-carrying driver may drive a maximum of:', ['11 hours', '8 hours', '14 hours', '16 hours'], 'Hours-of-service rules allow up to 11 hours of driving after 10 consecutive hours off duty.'],
                        ['Total stopping distance is made up of:', ['Perception distance, reaction distance and braking distance', 'Braking distance only', 'Reaction distance and following distance', 'Following distance and braking distance'], 'Your vehicle keeps moving while you notice the hazard and react, before the brakes even start working.'],
                        ['Before starting down a steep downgrade, you should:', ['Shift into a lower gear', 'Shift into neutral', 'Turn off the engine brake', 'Speed up to build momentum'], 'Shift down before the grade so the engine braking effect can help control your speed.'],
                        ['Why should you check your mirrors regularly?', ['To know where other vehicles are around you', 'To check your appearance', 'Only to watch the trailer tires', 'Mirrors are only needed when backing'], 'Regular mirror checks tell you where traffic is, so you can make safe lane changes and spot problems with your load.'],
                    ],
                ],
            ],
        ];
    }
}
