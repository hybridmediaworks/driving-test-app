import { ImageSourcePropType } from "react-native";

function px(id: number, w = 300, h = 200): ImageSourcePropType {
  return {
    uri: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`,
  };
}

export interface QuizQuestion {
  id: string;
  testId: string;
  text: string;
  image?: ImageSourcePropType;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ─── Motorcycle Easy 1 ────────────────────────────────────────────────────────
const MOTO_E1: QuizQuestion[] = [
  {
    id: "moto-e1-q1",
    testId: "moto-e1",
    text: "What are the four steps in making a proper turn?",
    options: [
      "Look, press, roll, slow",
      "Slow, look, press, roll",
      "Press, look, slow, roll",
      "Slow, press, look, roll",
    ],
    correctIndex: 1,
    explanation:
      "The correct sequence is Slow, Look, Press, Roll — slow down before the turn, look through it, press the handlebar to lean, then roll on the throttle as you exit.",
  },
  {
    id: "moto-e1-q2",
    testId: "moto-e1",
    text: "What should you do to avoid colliding with a vehicle cutting in?",
    image: px(2199293, 300, 220),
    options: [
      "Grab at the front brake",
      "Brake abruptly while swerving",
      "Swerve into the left lane",
      "Reduce speed and increase following distance",
    ],
    correctIndex: 3,
    explanation:
      "Grabbing the front brake or swerving abruptly can cause a loss of control. The safest response is to reduce speed and create more space.",
  },
  {
    id: "moto-e1-q3",
    testId: "moto-e1",
    text: "When should you increase your following distance?",
    options: [
      "On clear, dry roads",
      "During light traffic",
      "In rain, fog, or at night",
      "When riding on a straight road",
    ],
    correctIndex: 2,
    explanation:
      "Poor visibility and reduced traction in rain, fog, or at night require a longer following distance to give you more time to react.",
  },
  {
    id: "moto-e1-q4",
    testId: "moto-e1",
    text: "Which lane position is best when being passed by another vehicle?",
    image: px(1004409, 300, 220),
    options: [
      "Left portion of the lane",
      "Center of the lane",
      "Right portion of the lane",
    ],
    correctIndex: 0,
    explanation:
      "Riding in the left portion increases your visibility to oncoming traffic and keeps you away from the wind blast created by passing vehicles.",
  },
  {
    id: "moto-e1-q5",
    testId: "moto-e1",
    text: "What is the most effective way to stop quickly in an emergency?",
    options: [
      "Use only the rear brake",
      "Use only the front brake",
      "Apply both brakes simultaneously and firmly",
      "Release the throttle and coast to a stop",
    ],
    correctIndex: 2,
    explanation:
      "Using both brakes together provides the maximum stopping power. The front brake provides about 70% of braking force.",
  },
  {
    id: "moto-e1-q6",
    testId: "moto-e1",
    text: "What does a flashing yellow traffic light mean?",
    image: px(1557238, 300, 220),
    options: [
      "Stop and wait for a green light",
      "Proceed with caution",
      "The light is about to turn red",
    ],
    correctIndex: 1,
    explanation:
      "A flashing yellow light is a warning signal — you may proceed but must do so carefully, watching for cross traffic and pedestrians.",
  },
  {
    id: "moto-e1-q7",
    testId: "moto-e1",
    text: "When riding in a group, motorcycles should travel in which formation?",
    options: [
      "Single file",
      "Staggered formation",
      "Side by side",
      "Pairs with one rider leading",
    ],
    correctIndex: 1,
    explanation:
      "A staggered formation allows each rider adequate space while maintaining a compact group. Side-by-side reduces individual space and reaction time.",
  },
  {
    id: "moto-e1-q8",
    testId: "moto-e1",
    text: "How should you handle a curve at night?",
    image: px(1545743, 300, 220),
    options: [
      "Speed up to get through it faster",
      "Reduce speed and stay within your headlight range",
      "Hug the center line for more visibility",
    ],
    correctIndex: 1,
    explanation:
      "At night, you can only see as far as your headlight illuminates. Riding within that range ensures you can stop before reaching an unseen hazard.",
  },
];

// ─── Motorcycle Easy 2 ────────────────────────────────────────────────────────
const MOTO_E2: QuizQuestion[] = [
  {
    id: "moto-e2-q1",
    testId: "moto-e2",
    text: "Where should you position yourself when preparing to turn left at an intersection?",
    options: [
      "Right portion of the lane",
      "Left portion of the lane",
      "Center of the lane",
      "Directly behind the center line",
    ],
    correctIndex: 1,
    explanation:
      "Positioning yourself in the left portion of the lane helps you see oncoming traffic and signals your intent to other road users.",
  },
  {
    id: "moto-e2-q2",
    testId: "moto-e2",
    text: "What should you do if your front wheel skids?",
    image: px(2396045, 300, 220),
    options: [
      "Apply more front brake pressure",
      "Release the front brake immediately",
      "Turn the handlebars sharply",
    ],
    correctIndex: 1,
    explanation:
      "Releasing the front brake immediately restores traction and allows the wheel to spin again, giving you back steering control.",
  },
  {
    id: "moto-e2-q3",
    testId: "moto-e2",
    text: "What is the minimum following distance recommended for motorcycles?",
    options: ["1 second", "2 seconds", "3-4 seconds", "5 seconds"],
    correctIndex: 2,
    explanation:
      "A following distance of 3–4 seconds provides enough time to identify hazards and react, especially on slippery or uneven surfaces.",
  },
  {
    id: "moto-e2-q4",
    testId: "moto-e2",
    text: "Which protective gear is most critical for a motorcyclist?",
    options: [
      "Gloves and boots",
      "Helmet and eye protection",
      "Jacket and pants",
      "All of the above equally",
    ],
    correctIndex: 1,
    explanation:
      "While all gear matters, a helmet and eye protection are most critical. Head injuries are the leading cause of death in motorcycle crashes.",
  },
  {
    id: "moto-e2-q5",
    testId: "moto-e2",
    text: "When riding over railway tracks at an angle, what is the safest approach?",
    image: px(3354648, 300, 220),
    options: [
      "Cross at a 45-degree angle",
      "Cross as close to 90 degrees as possible",
      "Speed up to cross quickly",
    ],
    correctIndex: 1,
    explanation:
      "Crossing tracks at close to 90 degrees prevents your tire from following the groove, which could cause a loss of control.",
  },
  {
    id: "moto-e2-q6",
    testId: "moto-e2",
    text: "Alcohol affects motorcycle riding by:",
    options: [
      "Improving reaction time",
      "Reducing balance and coordination",
      "Increasing awareness of hazards",
      "Sharpening vision",
    ],
    correctIndex: 1,
    explanation:
      "Alcohol impairs the balance, coordination, and judgment that are essential for safe motorcycle operation.",
  },
];

// ─── Motorcycle Easy 3 ────────────────────────────────────────────────────────
const MOTO_E3: QuizQuestion[] = [
  {
    id: "moto-e3-q1",
    testId: "moto-e3",
    text: "What should you do when approaching a blind intersection?",
    options: [
      "Speed up to clear it quickly",
      "Slow down and be prepared to stop",
      "Honk your horn continuously",
      "Stay in the center of the lane",
    ],
    correctIndex: 1,
    explanation:
      "At a blind intersection, visibility is limited. Slowing down and preparing to stop ensures you can react to cross traffic you cannot yet see.",
  },
  {
    id: "moto-e3-q2",
    testId: "moto-e3",
    text: "What is the primary danger of riding in another vehicle's blind spot?",
    image: px(2611684, 300, 220),
    options: [
      "Reduced fuel efficiency",
      "The driver may not see you and change lanes",
      "Increased wind turbulence",
    ],
    correctIndex: 1,
    explanation:
      "If a driver cannot see you in their mirrors, they may merge into your lane without warning. Always pass through blind spots quickly or reposition.",
  },
  {
    id: "moto-e3-q3",
    testId: "moto-e3",
    text: "What is the correct response when a tire suddenly goes flat at speed?",
    options: [
      "Apply both brakes hard immediately",
      "Hold the handlebars firmly, ease off the throttle, and steer to safety",
      "Brake with the non-flat tire only",
      "Swerve to the nearest lane",
    ],
    correctIndex: 1,
    explanation:
      "A sudden flat can cause steering instability. Gripping firmly, gradually easing off the throttle, and gently guiding the bike to safety prevents a crash.",
  },
  {
    id: "moto-e3-q4",
    testId: "moto-e3",
    text: "How does carrying a passenger affect your motorcycle's handling?",
    options: [
      "Braking distance decreases",
      "The bike becomes more stable",
      "Braking distance increases and handling changes",
      "No significant effect",
    ],
    correctIndex: 2,
    explanation:
      "Extra weight increases stopping distance and shifts the center of gravity, requiring adjustments to speed and cornering technique.",
  },
  {
    id: "moto-e3-q5",
    testId: "moto-e3",
    text: "What gear should you be in when coming to a stop?",
    image: px(888316, 300, 220),
    options: ["Third gear", "Second gear", "First gear", "Neutral"],
    correctIndex: 2,
    explanation:
      "First gear allows you to accelerate immediately if needed after stopping, such as when avoiding a hazard.",
  },
  {
    id: "moto-e3-q6",
    testId: "moto-e3",
    text: "What should you check before every ride?",
    options: [
      "Tire pressure and tread only",
      "Fuel level only",
      "T-CLOCS: Tires, Controls, Lights, Oil, Chassis, Stands",
      "Brakes and headlight only",
    ],
    correctIndex: 2,
    explanation:
      "The T-CLOCS pre-ride inspection covers all critical systems: Tires & wheels, Controls, Lights & electrics, Oil & fluids, Chassis & chain, and Stands.",
  },
];

// ─── Car Easy 1 ───────────────────────────────────────────────────────────────
const CAR_E1: QuizQuestion[] = [
  {
    id: "car-e1-q1",
    testId: "car-e1",
    text: "What does a solid yellow center line on the road mean?",
    options: [
      "Passing is permitted on both sides",
      "Passing is permitted when safe",
      "No passing in either direction",
      "You are on a one-way road",
    ],
    correctIndex: 2,
    explanation:
      "A solid yellow line on your side of the center means you must not pass. It indicates oncoming traffic or hazards make passing unsafe.",
  },
  {
    id: "car-e1-q2",
    testId: "car-e1",
    text: "When must you use your headlights?",
    image: px(1638459, 300, 220),
    options: [
      "Only at night",
      "From sunset to sunrise and when visibility is less than 1,000 feet",
      "Only in rain or fog",
    ],
    correctIndex: 1,
    explanation:
      "Most states require headlights from sunset to sunrise and whenever weather conditions reduce visibility to 1,000 feet or less.",
  },
  {
    id: "car-e1-q3",
    testId: "car-e1",
    text: "What should you do when an emergency vehicle with sirens and lights approaches?",
    options: [
      "Speed up to clear the road",
      "Stop immediately where you are",
      "Pull to the right edge and stop until it passes",
      "Maintain your speed and let it pass",
    ],
    correctIndex: 2,
    explanation:
      "You are required by law to pull as far right as safely possible and stop until the emergency vehicle has passed.",
  },
  {
    id: "car-e1-q4",
    testId: "car-e1",
    text: "What is the hand signal for a left turn?",
    options: [
      "Left arm extended straight out",
      "Left arm bent upward at the elbow",
      "Left arm bent downward at the elbow",
      "Right arm extended out the window",
    ],
    correctIndex: 0,
    explanation:
      "Extending your left arm straight out signals a left turn. Arm bent up means right turn, bent down means slowing or stopping.",
  },
  {
    id: "car-e1-q5",
    testId: "car-e1",
    text: "At what blood alcohol concentration (BAC) is it illegal to drive in most US states for drivers 21+?",
    image: px(210019, 300, 220),
    options: ["0.05%", "0.08%", "0.10%", "0.12%"],
    correctIndex: 1,
    explanation:
      "The legal limit for drivers 21 and older is 0.08% BAC in most states. For commercial drivers it is 0.04%, and zero tolerance applies for those under 21.",
  },
  {
    id: "car-e1-q6",
    testId: "car-e1",
    text: "What does a yellow diamond-shaped sign indicate?",
    options: [
      "A regulatory rule you must obey",
      "A warning about a hazard or road condition ahead",
      "Information about services nearby",
      "A construction zone",
    ],
    correctIndex: 1,
    explanation:
      "Yellow diamond signs are warning signs. They alert drivers to potential hazards, changes in road conditions, or upcoming road features.",
  },
  {
    id: "car-e1-q7",
    testId: "car-e1",
    text: "When parallel parking, how far from the curb should your vehicle be?",
    options: [
      "Within 6 inches",
      "Within 12 inches",
      "Within 18 inches",
      "Within 24 inches",
    ],
    correctIndex: 1,
    explanation:
      "Most states require your vehicle to be within 12 inches of the curb when parallel parked to avoid obstructing traffic.",
  },
];

// ─── CDL Easy 1 ───────────────────────────────────────────────────────────────
const CDL_E1: QuizQuestion[] = [
  {
    id: "cdl-e1-q1",
    testId: "cdl-e1",
    text: "During a pre-trip inspection, what should you check in the engine compartment?",
    options: [
      "Only the oil level",
      "Oil, coolant, power steering fluid, and belts",
      "Fuel level and tire pressure only",
      "Battery and wiper blades only",
    ],
    correctIndex: 1,
    explanation:
      "A proper engine compartment check covers oil, coolant, power steering fluid, and drive belts — all critical for safe long-distance operation.",
  },
  {
    id: "cdl-e1-q2",
    testId: "cdl-e1",
    text: "How many hours may a property-carrying driver be on duty before requiring a 30-minute break?",
    image: px(1095814, 300, 220),
    options: ["6 hours", "8 hours", "10 hours", "11 hours"],
    correctIndex: 1,
    explanation:
      "FMCSA regulations require a 30-minute break after 8 cumulative hours of driving time without an interruption.",
  },
  {
    id: "cdl-e1-q3",
    testId: "cdl-e1",
    text: "What does a red octagonal sign always mean?",
    options: ["Slow down", "Yield", "Stop", "Do not enter"],
    correctIndex: 2,
    explanation:
      "A red octagonal (eight-sided) sign is exclusively used for STOP signs in the United States.",
  },
  {
    id: "cdl-e1-q4",
    testId: "cdl-e1",
    text: "What is the minimum tread depth required for front tires on commercial vehicles?",
    options: ['2/32"', '4/32"', '6/32"', '8/32"'],
    correctIndex: 1,
    explanation:
      'Front tires must have at least 4/32" of tread depth. Other tires require at least 2/32". Inadequate tread significantly reduces braking ability.',
  },
  {
    id: "cdl-e1-q5",
    testId: "cdl-e1",
    text: "When backing a trailer, which way do you turn the steering wheel to move the rear of the trailer left?",
    image: px(2199293, 300, 220),
    options: [
      "Turn the wheel left",
      "Turn the wheel right",
      "The wheel direction does not matter",
    ],
    correctIndex: 1,
    explanation:
      "When backing a trailer, the trailer moves opposite to the cab. Turning right moves the trailer rear to the left.",
  },
  {
    id: "cdl-e1-q6",
    testId: "cdl-e1",
    text: "What is the maximum weight for a standard 5-axle combination vehicle (gross vehicle weight rating)?",
    options: ["60,000 lbs", "80,000 lbs", "100,000 lbs", "120,000 lbs"],
    correctIndex: 1,
    explanation:
      "The federal maximum gross vehicle weight for most combination vehicles on Interstate highways is 80,000 pounds.",
  },
];

// ─── Fallback shared questions (used for tests without specific questions) ───
const SHARED_FALLBACK: QuizQuestion[] = [
  {
    id: "shared-q1",
    testId: "__shared__",
    text: "What does a flashing red traffic light mean?",
    image: px(1557238, 300, 220),
    options: [
      "Slow down and proceed",
      "Stop, then proceed when safe",
      "Prepare to stop",
      "The light is malfunctioning",
    ],
    correctIndex: 1,
    explanation:
      "A flashing red light must be treated as a STOP sign — come to a full stop, then proceed only when it is safe to do so.",
  },
  {
    id: "shared-q2",
    testId: "__shared__",
    text: "What is the correct action when you see a yellow traffic light?",
    options: [
      "Speed up to clear the intersection",
      "Stop if you can do so safely",
      "Continue at the same speed",
      "Sound your horn and proceed",
    ],
    correctIndex: 1,
    explanation:
      "A yellow light warns that the signal is changing to red. Stop if you can do so safely. Only proceed if stopping would be unsafe.",
  },
  {
    id: "shared-q3",
    testId: "__shared__",
    text: "When must you yield the right of way to a pedestrian?",
    options: [
      "Only at marked crosswalks",
      "At crosswalks and intersections, marked or not",
      "Only when there is a YIELD sign",
      "Never — pedestrians yield to vehicles",
    ],
    correctIndex: 1,
    explanation:
      "Drivers must yield to pedestrians at all crosswalks, whether painted or not. Pedestrian safety always takes priority.",
  },
  {
    id: "shared-q4",
    testId: "__shared__",
    text: "What is the correct response to a school bus with flashing red lights and extended stop arm?",
    options: [
      "Pass slowly on the left",
      "Stop on both sides of the road until the lights stop flashing",
      "Stop only if you are behind the bus",
      "Slow to 15 mph and proceed carefully",
    ],
    correctIndex: 1,
    explanation:
      "When a school bus activates its red lights and stop arm, all traffic on both sides of the road must stop — unless separated by a median.",
  },
];

export const MOCK_QUESTIONS: QuizQuestion[] = [
  ...MOTO_E1,
  ...MOTO_E2,
  ...MOTO_E3,
  ...CAR_E1,
  ...CDL_E1,
  ...SHARED_FALLBACK,
];
