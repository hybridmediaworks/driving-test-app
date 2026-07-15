import {
  MOCK_QUESTIONS,
  type QuizQuestion,
} from "@/data/mockQuestions";
import {
  Difficulty,
  MockExamConfig,
  MockHeroTest,
  MockTest,
  MockTheoryItem,
  MOCK_EXAM_CONFIGS,
  MOCK_HERO_TESTS,
  MOCK_TESTS,
  MOCK_THEORY_ITEMS,
} from "@/data/mockTests";
import { type VehicleType } from "@/store/userStore";

/**
 * Returns all tests for a given vehicle and difficulty level.
 */
export function getTests(vehicle: VehicleType, difficulty: Difficulty): MockTest[] {
  return MOCK_TESTS.filter(
    (t) => t.vehicle === vehicle && t.difficulty === difficulty
  );
}

/**
 * Returns the hero (next-up) test for a given vehicle.
 */
export function getHeroTest(vehicle: VehicleType): MockHeroTest {
  return (
    MOCK_HERO_TESTS.find((h) => h.vehicle === vehicle) ?? MOCK_HERO_TESTS[0]
  );
}

/**
 * Returns theory/cheat-sheet items for a given vehicle.
 */
export function getTheoryItems(vehicle: VehicleType): MockTheoryItem[] {
  return MOCK_THEORY_ITEMS.filter((t) => t.vehicle === vehicle);
}

/**
 * Returns a single test by id, or undefined if not found.
 * Also resolves exam simulator configs by their id.
 */
export function getTestById(id: string): MockTest | undefined {
  const test = MOCK_TESTS.find((t) => t.id === id);
  if (test) return test;

  const exam = MOCK_EXAM_CONFIGS.find((e) => e.id === id);
  if (exam) {
    return {
      id: exam.id,
      title: exam.title,
      subtitle: exam.subtitle,
      image: exam.image,
      difficulty: "hardest",
      vehicle: exam.vehicle,
      questionsCount: exam.totalSimulations,
      passingScore: 80,
      description: exam.description,
    };
  }
  return undefined;
}

/**
 * Returns questions for a given test. Falls back to shared questions when
 * no test-specific questions exist.
 */
export function getQuestionsByTestId(testId: string): QuizQuestion[] {
  const specific = MOCK_QUESTIONS.filter((q) => q.testId === testId);
  if (specific.length > 0) return specific;
  return MOCK_QUESTIONS.filter((q) => q.testId === "__shared__");
}

/**
 * Returns the exam simulator config for a given vehicle.
 */
export function getExamConfig(vehicle: VehicleType): MockExamConfig {
  return (
    MOCK_EXAM_CONFIGS.find((e) => e.vehicle === vehicle) ?? MOCK_EXAM_CONFIGS[0]
  );
}

/**
 * Returns the next test after the given id (same vehicle, sequential order).
 * Returns undefined if the current test is the last one.
 */
export function getNextTest(currentId: string): MockTest | undefined {
  const current = MOCK_TESTS.find((t) => t.id === currentId);
  if (!current) return undefined;
  const sameVehicle = MOCK_TESTS.filter((t) => t.vehicle === current.vehicle);
  const idx = sameVehicle.findIndex((t) => t.id === currentId);
  return sameVehicle.slice(idx + 1).find((t) => !t.locked);
}
