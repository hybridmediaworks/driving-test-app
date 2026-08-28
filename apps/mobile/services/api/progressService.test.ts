import { api } from "@/lib/api";

import { fetchChallengeBank } from "./challengeBankApi";
import { fetchProgressSummary } from "./progressService";
import { fetchQuizzes } from "./quizApi";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn() },
  ApiError: class ApiError extends Error {},
}));
jest.mock("./quizApi");
jest.mock("./challengeBankApi");

const mockApiGet = api.get as jest.Mock;
const mockFetchQuizzes = fetchQuizzes as jest.Mock;
const mockFetchChallengeBank = fetchChallengeBank as jest.Mock;

// Minimal PublicQuiz-shaped fixture — only the fields fetchProgressSummary actually reads.
function quiz(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Practice Test",
    quiz_type: { name: "practice" },
    attempted: false,
    user_passed: false,
    locked: false,
    total_questions: 10,
    ...overrides,
  };
}

function stats(average: number | null, completed: number) {
  return { attempts: { average_score: average, completed } };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchChallengeBank.mockResolvedValue([]);
});

describe("fetchProgressSummary", () => {
  it("aggregates practice / marathon / exam counts and the pass-chance", async () => {
    mockApiGet.mockResolvedValue(stats(82.4, 3));
    mockFetchQuizzes.mockResolvedValue([
      quiz({ id: 1, attempted: true, user_passed: true }),
      quiz({ id: 2, attempted: false }),
      quiz({ id: 3, title: "CA Advanced Marathon", attempted: true, total_questions: 20 }),
      quiz({ id: 9, title: "Final Exam", quiz_type: { name: "final" }, locked: true }),
    ]);
    mockFetchChallengeBank.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const summary = await fetchProgressSummary("car", "CA");

    expect(summary.passChancePercent).toBe(82); // rounded from 82.4
    expect(summary.hasCompletedAttempts).toBe(true);
    expect(summary.practiceTotal).toBe(2);
    expect(summary.practicePassed).toBe(1);
    expect(summary.practiceCompleted).toBe(1);
    expect(summary.marathonTotal).toBe(1);
    expect(summary.marathonCompleted).toBe(1);
    expect(summary.marathonQuestionsTotal).toBe(20);
    expect(summary.marathonQuestionsAnswered).toBe(20);
    expect(summary.examTotal).toBe(1);
    expect(summary.examPassed).toBe(0);
    expect(summary.examLocked).toBe(true);
    // First unfinished, unlocked practice quiz -> id 2.
    expect(summary.nextPracticeQuizId).toBe("2");
    expect(summary.challengeBankCount).toBe(2);
  });

  it("degrades to a zero pass-chance when the stats request fails", async () => {
    mockApiGet.mockRejectedValue(new Error("stats down"));
    mockFetchQuizzes.mockResolvedValue([quiz({ id: 1, attempted: true })]);

    const summary = await fetchProgressSummary("car", "CA");

    expect(summary.passChancePercent).toBe(0);
    expect(summary.hasCompletedAttempts).toBe(false);
    // Counts still come through — a stats hiccup never blanks the page.
    expect(summary.practiceTotal).toBe(1);
  });

  it("degrades the challenge-bank count to zero when that request fails", async () => {
    mockApiGet.mockResolvedValue(stats(50, 1));
    mockFetchQuizzes.mockResolvedValue([quiz({ id: 1 })]);
    mockFetchChallengeBank.mockRejectedValue(new Error("bank down"));

    const summary = await fetchProgressSummary("car", "CA");

    expect(summary.challengeBankCount).toBe(0);
  });

  it("rejects when the primary quizzes request fails (so the screen can show an error)", async () => {
    mockApiGet.mockResolvedValue(stats(50, 1));
    mockFetchQuizzes.mockRejectedValue(new Error("network"));

    await expect(fetchProgressSummary("car", "CA")).rejects.toThrow("network");
  });
});
