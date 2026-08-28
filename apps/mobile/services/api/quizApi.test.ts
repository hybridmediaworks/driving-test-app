import { api } from "@/lib/api";

import { checkAnswer, fetchQuiz } from "./quizApi";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  ApiError: class ApiError extends Error {},
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("fetchQuiz — test language", () => {
  it("omits the language param for English (the untranslated source)", async () => {
    mockGet.mockResolvedValue({});
    await fetchQuiz(5, "en");
    expect(mockGet).toHaveBeenCalledWith("/quizzes/5");
  });

  it("omits the language param when none is given", async () => {
    mockGet.mockResolvedValue({});
    await fetchQuiz(5);
    expect(mockGet).toHaveBeenCalledWith("/quizzes/5");
  });

  it("requests translated content with ?language=es for Spanish", async () => {
    mockGet.mockResolvedValue({});
    await fetchQuiz(5, "es");
    expect(mockGet).toHaveBeenCalledWith("/quizzes/5?language=es");
  });
});

describe("checkAnswer — test language", () => {
  it("sends only the answer for English", async () => {
    mockPost.mockResolvedValue({});
    await checkAnswer(5, 10, 3, "en");
    expect(mockPost).toHaveBeenCalledWith("/quizzes/5/questions/10/check", {
      answer_id: 3,
    });
  });

  it("includes language so the explanation matches the translated questions", async () => {
    mockPost.mockResolvedValue({});
    await checkAnswer(5, 10, 3, "es");
    expect(mockPost).toHaveBeenCalledWith("/quizzes/5/questions/10/check", {
      answer_id: 3,
      language: "es",
    });
  });
});
