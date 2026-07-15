import { type VehicleType } from "@/store/userStore";
import { ImageSourcePropType } from "react-native";

// ─── Image helper (Pexels free CDN) ──────────────────────────────────────────
function px(id: number): ImageSourcePropType {
  return {
    uri: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type Difficulty = "easy" | "hard" | "hardest";

export interface MockTest {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  locked?: boolean;
  difficulty: Difficulty;
  vehicle: VehicleType;
  questionRange?: string;
  questionsCount: number;
  passingScore: number;
  description: string;
}

export interface MockTheoryItem {
  id: string;
  title: string;
  icon: "cloud-download" | "lock";
  action: "get" | "unlock";
  vehicle: VehicleType;
  description?: string;
  fileInfo?: string;
}

export interface MockExamConfig {
  id: string;
  vehicle: VehicleType;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  totalSimulations: number;
  description: string;
}

export interface MockHeroTest {
  vehicle: VehicleType;
  title: string;
  description: string;
  image: ImageSourcePropType;
  testId: string;
}

// ─── Mock test data ────────────────────────────────────────────────────────────
export const MOCK_TESTS: MockTest[] = [
  // ── Motorcycle ──
  {
    id: "moto-e1",
    title: "Moto Practice Test 1",
    subtitle: "Questions 1–30",
    image: px(2611684),
    difficulty: "easy",
    vehicle: "motorcycle",
    questionsCount: 30,
    passingScore: 80,
    description:
      "The roads are yours to explore. Whether you prefer an iconic Harley Davidson or a nimble Kawasaki, it is crucial that you ride safely. This test covers the fundamental rules of the road, traffic signs, and safe riding techniques to prepare you for your DMV motorcycle exam. Whether you prefer an iconic Harley Davidson or a nimble Kawasaki, it is crucial that you ride safely. This test covers the fundamental rules of the road, traffic signs, and safe riding techniques to prepare you for your DMV motorcycle exam.",
  },
  {
    id: "moto-e2",
    title: "Moto Practice Test 2",
    subtitle: "Questions 31–60",
    image: px(142828),
    difficulty: "easy",
    vehicle: "motorcycle",
    questionsCount: 30,
    passingScore: 80,
    description:
      "Continue building your motorcycle knowledge with this second set of practice questions. Topics include lane positioning, signaling, and how to handle intersections safely on two wheels.",
  },
  {
    id: "moto-e3",
    title: "Moto Practice Test 3",
    subtitle: "Questions 61–90",
    image: px(2396045),
    difficulty: "easy",
    vehicle: "motorcycle",
    questionsCount: 30,
    passingScore: 80,
    description:
      "Round out the easy tier with this third practice test. Questions focus on braking distances, road hazards, and protective gear requirements for motorcyclists.",
  },
  {
    id: "moto-h1",
    title: "Moto Practice Test 4",
    subtitle: "Questions 1–50",
    image: px(18428157),
    difficulty: "hard",
    vehicle: "motorcycle",
    questionsCount: 50,
    passingScore: 80,
    description:
      "Step up to harder scenarios including highway riding, adverse weather conditions, and complex traffic situations. This test is designed to challenge riders who already have a grasp of the basics.",
  },
  {
    id: "moto-h2",
    title: "Moto Practice Test 5",
    subtitle: "Questions 51–100",
    image: px(888316),
    difficulty: "hard",
    vehicle: "motorcycle",
    questionsCount: 50,
    passingScore: 80,
    description:
      "Tackle the second half of the hard-tier questions covering night riding, sharing the road with large vehicles, and emergency maneuvers critical to motorcycle safety.",
  },
  {
    id: "moto-h3",
    title: "Moto Practice Test 6",
    subtitle: "Questions 101–150",
    image: px(2611690),
    difficulty: "hard",
    vehicle: "motorcycle",
    questionsCount: 50,
    passingScore: 80,
    description:
      "The final hard-tier test covers advanced topics such as passenger safety, cargo carrying limits, and specific state laws that every licensed motorcyclist must know.",
  },
  {
    id: "moto-x1",
    title: "Fines & Limits",
    subtitle: "50 Questions",
    image: px(12993723),
    difficulty: "hardest",
    vehicle: "motorcycle",
    questionsCount: 50,
    passingScore: 85,
    description:
      "Master the specifics: speed limits, fines, blood alcohol limits, and legal penalties. These questions are the ones most riders miss — get them right before your exam.",
  },
  {
    id: "moto-x2",
    title: "Moto Marathon",
    subtitle: "All 307 questions",
    image: px(23515330),
    difficulty: "hardest",
    locked: true,
    vehicle: "motorcycle",
    questionsCount: 307,
    passingScore: 85,
    description:
      "The ultimate preparation: every single motorcycle practice question in one sitting. Unlock this test to ensure you are fully prepared for anything the DMV exam can throw at you.",
  },

  // ── Car ──
  {
    id: "car-e1",
    title: "Car Practice Test 1",
    subtitle: "Questions 1–30",
    image: px(1545743),
    difficulty: "easy",
    vehicle: "car",
    questionsCount: 30,
    passingScore: 80,
    description:
      "Start your journey to a driver's license with this first practice test. Questions cover basic road signs, right-of-way rules, and essential safe driving habits every new driver must know. Start your journey to a driver's license with this first practice test. Questions cover basic road signs, right-of-way rules, and essential safe driving habits every new driver must know. Start your journey to a driver's license with this first practice test. Questions cover basic road signs, right-of-way rules, and essential safe driving habits every new driver must know.Start your journey to a driver's license with this first practice test. Questions cover basic road signs, right-of-way rules, and essential safe driving habits every new driver must know.",
  },
  {
    id: "car-e2",
    title: "Car Practice Test 2",
    subtitle: "Questions 31–60",
    image: px(1638459),
    difficulty: "easy",
    vehicle: "car",
    questionsCount: 30,
    passingScore: 80,
    description:
      "Continue with questions on parking rules, school zones, and pedestrian safety. A great follow-up once you have completed the first test.",
  },
  {
    id: "car-e3",
    title: "Car Practice Test 3",
    subtitle: "Questions 61–90",
    image: px(210019),
    difficulty: "easy",
    vehicle: "car",
    questionsCount: 30,
    passingScore: 80,
    description:
      "Complete the easy tier by reviewing traffic signals, merging onto highways, and the rules around railroad crossings and emergency vehicles.",
  },
  {
    id: "car-h1",
    title: "Car Practice Test 4",
    subtitle: "Questions 1–50",
    image: px(3354648),
    difficulty: "hard",
    vehicle: "car",
    questionsCount: 50,
    passingScore: 80,
    description:
      "Move into harder territory with questions on distracted driving laws, DUI penalties, and navigating complex intersections. Ideal once you feel confident with the basics.",
  },
  {
    id: "car-h2",
    title: "Car Practice Test 5",
    subtitle: "Questions 51–100",
    image: px(4112986),
    difficulty: "hard",
    vehicle: "car",
    questionsCount: 50,
    passingScore: 80,
    description:
      "The second hard-tier test digs into highway driving, construction zones, and night driving rules — areas that commonly appear on DMV written exams.",
  },
  {
    id: "car-x1",
    title: "Road Signs & Rules",
    subtitle: "50 Questions",
    image: px(1004409),
    difficulty: "hardest",
    vehicle: "car",
    questionsCount: 50,
    passingScore: 85,
    description:
      "Every road sign, pavement marking, and traffic signal explained through practice questions. Sign recognition is one of the most tested areas — make sure you know them all.",
  },
  {
    id: "car-x2",
    title: "Full Car Marathon",
    subtitle: "All 250 questions",
    image: px(3729464),
    difficulty: "hardest",
    locked: true,
    vehicle: "car",
    questionsCount: 250,
    passingScore: 85,
    description:
      "Every car practice question in one comprehensive test. Unlock this to get the fullest possible preparation before you walk into the DMV.",
  },

  // ── Truck (CDL) ──
  {
    id: "cdl-e1",
    title: "CDL Practice Test 1",
    subtitle: "Questions 1–30",
    image: px(1095814),
    difficulty: "easy",
    vehicle: "truck",
    questionsCount: 30,
    passingScore: 80,
    description:
      "Begin your CDL preparation with foundational knowledge: vehicle inspections, basic controls, and the general knowledge required for all commercial drivers.",
  },
  {
    id: "cdl-e2",
    title: "CDL Practice Test 2",
    subtitle: "Questions 31–60",
    image: px(2199293),
    difficulty: "easy",
    vehicle: "truck",
    questionsCount: 30,
    passingScore: 80,
    description:
      "Continue with questions on shifting, backing, and coupling/uncoupling procedures. Essential knowledge for anyone pursuing a Class A CDL.",
  },
  {
    id: "cdl-h1",
    title: "CDL Practice Test 3",
    subtitle: "Questions 1–50",
    image: px(1427107),
    difficulty: "hard",
    vehicle: "truck",
    questionsCount: 50,
    passingScore: 80,
    description:
      "Hard-tier CDL questions focus on hours-of-service regulations, load securement, and handling skids or emergency situations in a large commercial vehicle.",
  },
  {
    id: "cdl-h2",
    title: "CDL Practice Test 4",
    subtitle: "Questions 51–100",
    image: px(3024454),
    difficulty: "hard",
    vehicle: "truck",
    questionsCount: 50,
    passingScore: 80,
    description:
      "The second hard test covers air brakes, combination vehicles, and the specific endorsement knowledge needed for tanker and flatbed operations.",
  },
  {
    id: "cdl-x1",
    title: "HazMat & Air Brakes",
    subtitle: "50 Questions",
    image: px(2449454),
    difficulty: "hardest",
    vehicle: "truck",
    questionsCount: 50,
    passingScore: 85,
    description:
      "Hazardous materials handling and air brake systems are among the most complex CDL topics. This test ensures you have the in-depth knowledge required for these high-stakes endorsements.",
  },
  {
    id: "cdl-x2",
    title: "CDL Marathon",
    subtitle: "All 200 questions",
    image: px(4063789),
    difficulty: "hardest",
    locked: true,
    vehicle: "truck",
    questionsCount: 200,
    passingScore: 85,
    description:
      "Every CDL practice question across all topics and endorsements. Unlock for complete exam readiness before your commercial driver's license test.",
  },
];

// ─── Mock theory items ─────────────────────────────────────────────────────────
export const MOCK_THEORY_ITEMS: MockTheoryItem[] = [
  {
    id: "moto-theory-1",
    title: "Motorcycle Manual",
    icon: "cloud-download",
    action: "get",
    vehicle: "motorcycle",
    description: "Printable PDF e-book. View them inside the app or send to your printer.",
    fileInfo: "PDF, 80 pages, 26.0 MB",
  },
  {
    id: "moto-theory-2",
    title: "Motorcycle Test Questions",
    icon: "lock",
    action: "unlock",
    vehicle: "motorcycle",
    description: "55 Most Common Questions",
    fileInfo: "PDF, 8 pages, 2.3 MB",
  },
  {
    id: "moto-theory-3",
    title: "Road Signs",
    icon: "lock",
    action: "unlock",
    vehicle: "motorcycle",
    description: "120 Most Common Road Signs",
    fileInfo: "PDF, 11 pages, 3.7 MB",
  },
  {
    id: "moto-theory-4",
    title: "US DMV Questions",
    icon: "lock",
    action: "unlock",
    vehicle: "motorcycle",
    description: "100 Most Common Questions",
    fileInfo: "PDF, 14 pages, 4.1 MB",
  },
  {
    id: "car-theory-1",
    title: "Driver's Manual",
    icon: "cloud-download",
    action: "get",
    vehicle: "car",
    description: "Printable PDF e-book. View them inside the app or send to your printer.",
    fileInfo: "PDF, 80 pages, 26.0 MB",
  },
  {
    id: "car-theory-2",
    title: "Car Test Questions",
    icon: "lock",
    action: "unlock",
    vehicle: "car",
    description: "50 Most Common Questions",
    fileInfo: "PDF, 8 pages, 2.1 MB",
  },
  {
    id: "car-theory-3",
    title: "Road Signs",
    icon: "lock",
    action: "unlock",
    vehicle: "car",
    description: "120 Most Common Road Signs",
    fileInfo: "PDF, 11 pages, 3.7 MB",
  },
  {
    id: "car-theory-4",
    title: "US DMV Questions",
    icon: "lock",
    action: "unlock",
    vehicle: "car",
    description: "100 Most Common Questions",
    fileInfo: "PDF, 14 pages, 4.1 MB",
  },
  {
    id: "cdl-theory-1",
    title: "CDL Manual",
    icon: "cloud-download",
    action: "get",
    vehicle: "truck",
    description: "Printable PDF e-book. View them inside the app or send to your printer.",
    fileInfo: "PDF, 95 pages, 31.5 MB",
  },
  {
    id: "cdl-theory-2",
    title: "CDL Test Questions",
    icon: "lock",
    action: "unlock",
    vehicle: "truck",
    description: "60 Most Common Questions",
    fileInfo: "PDF, 10 pages, 2.8 MB",
  },
  {
    id: "cdl-theory-3",
    title: "HazMat Guide",
    icon: "lock",
    action: "unlock",
    vehicle: "truck",
    description: "HazMat & Air Brake Regulations",
    fileInfo: "PDF, 14 pages, 4.1 MB",
  },
  {
    id: "cdl-theory-4",
    title: "CDL General Knowledge",
    icon: "lock",
    action: "unlock",
    vehicle: "truck",
    description: "100 Most Common CDL Questions",
    fileInfo: "PDF, 16 pages, 4.8 MB",
  },
];

// ─── Mock exam configs ─────────────────────────────────────────────────────────
export const MOCK_EXAM_CONFIGS: MockExamConfig[] = [
  {
    id: "exam-motorcycle",
    vehicle: "motorcycle",
    title: "DMV Exam Simulator",
    subtitle: "30 random questions",
    image: px(14285088),
    totalSimulations: 3,
    description:
      "Experience the real DMV motorcycle exam in simulation mode. Each session draws 30 random questions from the full question bank, covering traffic laws, road signs, and safe riding techniques. You must score 80% or higher to pass. Complete up to 3 simulations to build your confidence before test day.",
  },
  {
    id: "exam-car",
    vehicle: "car",
    title: "DMV Exam Simulator",
    subtitle: "46 random questions",
    image: px(1072179),
    totalSimulations: 3,
    description:
      "Simulate the actual DMV written exam with 46 randomly selected questions mirroring the real test format. Topics span road signs, right-of-way rules, speed limits, and safe driving practices. A passing score of 80% is required. Take up to 3 full simulations to get exam-ready.",
  },
  {
    id: "exam-truck",
    vehicle: "truck",
    title: "CDL Exam Simulator",
    subtitle: "50 random questions",
    image: px(1392616),
    totalSimulations: 3,
    description:
      "Prepare for the CDL General Knowledge exam with 50 randomly selected questions covering vehicle inspection, cargo handling, hazardous materials, and hours-of-service regulations. Each simulation replicates real exam conditions. Score 80% or higher to pass. Up to 3 simulations available.",
  },
];

// ─── Mock hero tests ───────────────────────────────────────────────────────────
export const MOCK_HERO_TESTS: MockHeroTest[] = [
  {
    vehicle: "motorcycle",
    title: "Moto Practice Test 1",
    description:
      "Use this card to proceed. It'll always point to the next test you need to take.",
    image: px(2611686),
    testId: "moto-e1",
  },
  {
    vehicle: "car",
    title: "Car Practice Test 1",
    description:
      "Use this card to proceed. It'll always point to the next test you need to take.",
    image: px(1638459),
    testId: "car-e1",
  },
  {
    vehicle: "truck",
    title: "CDL Practice Test 1",
    description:
      "Use this card to proceed. It'll always point to the next test you need to take.",
    image: px(1095814),
    testId: "cdl-e1",
  },
];
