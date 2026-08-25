import { api } from "@/lib/api";
import type {
  PaginatedResponse,
  PublicCheatSheet,
  PublicQuiz,
  QuizAnswerCheckResponse,
  QuizAttempt,
  QuizCategory,
  QuizShowResponse,
} from "@driving-test-app/shared";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

export async function fetchQuizzes(params: {
  vehicleType: string;
  state: string;
  category?: string;
  quizType?: string;
  testTrack?: string;
  perPage?: number;
}): Promise<PublicQuiz[]> {
  const qs = buildQuery({
    vehicle_type: params.vehicleType,
    state: params.state,
    category: params.category,
    quiz_type: params.quizType,
    test_track: params.testTrack,
    per_page: params.perPage ?? 20,
  });
  const res = await api.get<PaginatedResponse<PublicQuiz>>(`/quizzes${qs}`);
  return res.data;
}

export async function fetchQuiz(id: number | string): Promise<QuizShowResponse> {
  return api.get<QuizShowResponse>(`/quizzes/${id}`);
}

export async function fetchQuizCategories(): Promise<QuizCategory[]> {
  const res = await api.get<{ data: QuizCategory[] }>("/quiz-categories");
  return res.data;
}

export async function fetchCheatSheets(params: {
  vehicleType: string;
  state: string;
  perPage?: number;
}): Promise<PublicCheatSheet[]> {
  const qs = buildQuery({
    vehicle_type: params.vehicleType,
    state: params.state,
    per_page: params.perPage ?? 10,
  });
  const res = await api.get<PaginatedResponse<PublicCheatSheet>>(`/cheat-sheets${qs}`);
  return res.data;
}

/**
 * Instant per-question feedback (practice mode) — reveals correctness + explanation for the one
 * answer just picked. The `show` endpoint above deliberately withholds this until now.
 */
export async function checkAnswer(
  quizId: number | string,
  questionId: number,
  answerId: number,
): Promise<QuizAnswerCheckResponse> {
  return api.post<QuizAnswerCheckResponse>(`/quizzes/${quizId}/questions/${questionId}/check`, {
    answer_id: answerId,
  });
}

/**
 * Submits the full set of answers for grading. `answer_id: null` for a skipped question is fine
 * — it still counts toward `total_questions` but scores as incorrect. Works for guests too (no
 * auth token needed); `lib/api.ts`'s client attaches one automatically when the user is logged in.
 */
export async function submitAttempt(
  quizId: number | string,
  answers: { question_id: number; answer_id: number | null }[],
  durationSeconds?: number,
): Promise<QuizAttempt> {
  const res = await api.post<{ attempt: QuizAttempt }>(`/quizzes/${quizId}/attempts`, {
    answers,
    duration_seconds: durationSeconds,
  });
  return res.attempt;
}
