import {
  fetchCheatSheets,
  fetchQuizCategories,
  fetchQuizzes,
} from "./quizApi";
import {
  fetchTestsByCategory,
  fetchTheoryList,
  fetchTodayData,
  pickHeroTest,
  type TodayTestRow,
} from "./todayService";

// Factory mock (not automock) so the real quizApi -> lib/api -> native-module chain never loads.
jest.mock("./quizApi", () => ({
  fetchQuizzes: jest.fn(),
  fetchQuizCategories: jest.fn(),
  fetchCheatSheets: jest.fn(),
  fetchQuiz: jest.fn(),
}));

const mockFetchQuizzes = fetchQuizzes as jest.Mock;
const mockFetchCategories = fetchQuizCategories as jest.Mock;
const mockFetchCheatSheets = fetchCheatSheets as jest.Mock;

function quiz(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Quiz",
    quiz_type: { name: "practice" },
    category: { id: 10, name: "basics", title: "Basics" },
    total_questions: 10,
    locked: false,
    passing_score_percent: 80,
    preview_image_url: null,
    cover_image_url: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchCategories.mockResolvedValue([]);
  mockFetchCheatSheets.mockResolvedValue([]);
});

describe("fetchTodayData", () => {
  it("groups quizzes into category rows (in order), splits out the exam, and maps cheat sheets", async () => {
    mockFetchCategories.mockResolvedValue([
      { id: 10, name: "basics", title: "Basics" },
      { id: 20, name: "advanced", title: "Advanced" },
      { id: 99, name: "extra", title: "The extra support" },
    ]);
    mockFetchQuizzes.mockResolvedValue([
      quiz({ id: 1, title: "Basics 1", category: { id: 10, name: "basics", title: "Basics" } }),
      quiz({ id: 2, title: "Advanced 1", category: { id: 20, name: "advanced", title: "Advanced" } }),
      quiz({ id: 3, title: "Extra 1", category: { id: 99, name: "extra", title: "The extra support" } }),
      quiz({
        id: 9,
        title: "Exam Simulator",
        quiz_type: { name: "final" },
        total_questions: 40,
        category: { id: 10, name: "basics", title: "Basics" },
      }),
    ]);
    mockFetchCheatSheets.mockResolvedValue([
      { id: 1, title: "Road signs", locked: false, summary: "s" },
      { id: 2, title: "Rules", locked: true, summary: null },
    ]);

    const data = await fetchTodayData("car", "CA");

    // Three rows, "The extra support" forced last, each with a Step badge.
    expect(data.testRows.map((r) => r.title)).toEqual(["Basics", "Advanced", "The extra support"]);
    expect(data.testRows.map((r) => r.badge)).toEqual(["Step 1", "Step 2", "Step 3"]);
    expect(data.testRows[0].tests).toHaveLength(1);
    expect(data.testRows[0].tests[0]).toMatchObject({ id: "1", title: "Basics 1" });

    // The final-type quiz is pulled out into its own exam card, not a row.
    expect(data.examCard).toMatchObject({ id: "9", title: "Exam Simulator", totalQuestions: 40 });

    // Cheat sheets become theory items, locked -> "unlock".
    expect(data.theoryItems).toEqual([
      { id: "1", title: "Road signs", icon: "cloud-download", action: "get" },
      { id: "2", title: "Rules", icon: "lock", action: "unlock" },
    ]);
  });

  it("degrades when a secondary request fails: no category rows, but exam + theory still load", async () => {
    mockFetchCategories.mockRejectedValue(new Error("categories down"));
    mockFetchQuizzes.mockResolvedValue([
      quiz({ id: 9, title: "Exam", quiz_type: { name: "final" }, total_questions: 30 }),
    ]);
    mockFetchCheatSheets.mockResolvedValue([{ id: 1, title: "Signs", locked: false }]);

    const data = await fetchTodayData("car", "CA");

    expect(data.testRows).toHaveLength(0); // no categories to group by
    expect(data.examCard).toMatchObject({ id: "9" });
    expect(data.theoryItems).toHaveLength(1);
  });

  it("rejects when the primary quizzes request fails", async () => {
    mockFetchQuizzes.mockRejectedValue(new Error("network"));

    await expect(fetchTodayData("car", "CA")).rejects.toThrow("network");
  });
});

describe("fetchTestsByCategory", () => {
  it("returns mapped cards, excluding exam-simulator (final) quizzes", async () => {
    mockFetchQuizzes.mockResolvedValue([
      quiz({ id: 1, title: "Basics 1" }),
      quiz({ id: 2, title: "Final", quiz_type: { name: "final" } }),
    ]);

    const cards = await fetchTestsByCategory("car", "CA", "basics");

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ id: "1", title: "Basics 1", subtitle: "10 Questions" });
  });

  it("propagates a failure so the See-all screen can show an error state", async () => {
    mockFetchQuizzes.mockRejectedValue(new Error("network"));
    await expect(fetchTestsByCategory("car", "CA", "basics")).rejects.toThrow("network");
  });
});

describe("fetchTheoryList", () => {
  it("maps cheat sheets to list items (empty summary -> undefined description)", async () => {
    mockFetchCheatSheets.mockResolvedValue([
      { id: 5, title: "Signs", locked: false, summary: "quick guide" },
      { id: 6, title: "Rules", locked: true, summary: "" },
    ]);

    const list = await fetchTheoryList("car", "CA");

    expect(list).toEqual([
      { id: "5", title: "Signs", description: "quick guide", locked: false },
      { id: "6", title: "Rules", description: undefined, locked: true },
    ]);
  });

  it("propagates a failure so the Theory See-all screen can show an error state", async () => {
    mockFetchCheatSheets.mockRejectedValue(new Error("down"));
    await expect(fetchTheoryList("car", "CA")).rejects.toThrow("down");
  });
});

describe("pickHeroTest", () => {
  const row = (tests: TodayTestRow["tests"]): TodayTestRow => ({
    category: "basics",
    title: "Basics",
    badge: "Step 1",
    tests,
  });
  const card = (id: string, locked = false) =>
    ({ id, title: `Test ${id}`, subtitle: "10 Questions", image: { uri: "x" }, locked, passingScore: 80 });

  it("picks the first unlocked, not-yet-completed test", () => {
    const rows = [row([card("a", true), card("b"), card("c")])];
    const hero = pickHeroTest(rows, new Set(["b"]));
    expect(hero?.testId).toBe("c");
  });

  it("falls back to the first unlocked test when everything visible is completed", () => {
    const rows = [row([card("a", true), card("b")])];
    const hero = pickHeroTest(rows, new Set(["b"]));
    expect(hero?.testId).toBe("b");
  });

  it("returns null when there are no tests at all", () => {
    expect(pickHeroTest([], new Set())).toBeNull();
  });
});
