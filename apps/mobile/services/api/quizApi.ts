import { api } from "@/lib/api";
import type {
  PaginatedResponse,
  PublicCheatSheet,
  PublicQuiz,
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
