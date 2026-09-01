import { api } from "@/lib/api";
import type {
  PaginatedResponse,
  PublicCheatSheet,
  PublicQuiz,
  QuizAnswerCheckResponse,
  QuizAssistResponse,
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

export async function fetchQuiz(
  id: number | string,
  language?: string,
): Promise<QuizShowResponse> {
  // Only send `language` for a non-English choice; the backend treats its absence as the English
  // source and translates on demand for anything else (see SUPPORTED_LOCALES).
  const qs = buildQuery({ language: language && language !== "en" ? language : undefined });
  return api.get<QuizShowResponse>(`/quizzes/${id}${qs}`);
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
  language?: string,
): Promise<QuizAnswerCheckResponse> {
  return api.post<QuizAnswerCheckResponse>(`/quizzes/${quizId}/questions/${questionId}/check`, {
    answer_id: answerId,
    // Translates the returned explanation to match the questions the learner is reading.
    ...(language && language !== "en" ? { language } : {}),
  });
}

export type QuestionReportPayload = {
  comment: string;
  flagged: {
    question: boolean;
    image: boolean;
    hint: boolean;
    answers: number[];
  };
  reporter_name: string | null;
  reporter_email: string | null;
};

/**
 * Report a mistake/typo in a question (wrong question text, bad image, misleading hint, or a
 * specific answer). Mirrors the web "Report a mistake" dialog. `comment` is required.
 */
export async function reportQuestion(
  quizId: number | string,
  questionId: number,
  payload: QuestionReportPayload,
): Promise<void> {
  await api.post(`/quizzes/${quizId}/questions/${questionId}/report`, payload);
}

/**
 * "Ask DMV Genie AI" — RAG-grounded tutor for the current question. `hint` mode returns one short
 * nudge (no message needed); `ask` mode answers the learner's follow-up `message` about the
 * question. `answered` gates the reveal: until the learner has answered, the backend keeps every
 * reply non-revealing; once answered, `ask` mode may give the full explanation. `selectedAnswerId`
 * (only honoured once answered) tells the tutor which option the learner picked so it can explain
 * why that specific choice is wrong. Throws ApiError(503) when the AI tutor isn't configured, and
 * ApiError(429) when the per-minute rate limit is hit.
 */
export async function askQuestionAssist(
  quizId: number | string,
  questionId: number,
  mode: "hint" | "ask",
  message?: string,
  answered = false,
  selectedAnswerId?: number,
): Promise<string> {
  const res = await api.post<QuizAssistResponse>(
    `/quizzes/${quizId}/questions/${questionId}/assist`,
    { mode, message, answered, selected_answer_id: selectedAnswerId },
  );
  return res.reply;
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
