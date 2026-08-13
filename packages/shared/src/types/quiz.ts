export type QuizCategory = {
  id: number;
  name: string;
  title: string;
  description: string | null;
  order_no: number;
  is_active: boolean;
  quizzes_count?: number;
  created_at: string;
  updated_at: string;
};

export type QuizType = {
  id: number;
  name: string;
  title: string;
  created_at?: string;
  updated_at?: string;
};

export type State = {
  id: number;
  code: string;
  name: string;
  agency_name: string | null;
  dmv_website_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type VehicleType = {
  id: number;
  name: string;
  title: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizAnswer = {
  id: number;
  quiz_question_id: number;
  answer_text: string;
  explanation: string | null;
  is_correct: boolean;
  sort_order: number;
};

export type QuizQuestion = {
  id: number;
  quiz_id: number;
  question_text: string;
  explanation: string | null;
  difficulty: QuizDifficulty;
  topic: string | null;
  sort_order: number;
  images: string[];
  image_urls: string[];
  answers?: QuizAnswer[];
};

export type Quiz = {
  id: number;
  quiz_category_id: number;
  quiz_type_id: number;
  state_id: number;
  vehicle_type_id: number;
  title: string;
  slug: string;
  source_url: string | null;
  order_no: number;
  cover_image_url: string | null;
  test_track: "permit_test" | "driving_test";
  total_questions: number;
  duration_seconds: number | null;
  passing_score_percent: number | null;
  is_premium: boolean;
  is_active: boolean;
  // Only present when this shape is populated from the public /quizzes endpoint (see
  // lib/phaseLadder.ts, WrittenTestContent.tsx) — the admin endpoint doesn't compute it, since
  // admins bypass all entitlement gates.
  locked?: boolean;
  // Real pass rate (0-100) from graded quiz_attempts, null when there's no real attempt data yet
  // — show nothing rather than a misleading 0%. Same "only present from the public endpoint" note
  // as `locked` above.
  pass_rate?: number | null;
  category?: QuizCategory;
  quiz_type?: QuizType;
  state?: State;
  vehicle_type?: VehicleType;
  quiz_questions_count?: number;
};

export type LaravelPageLink = {
  url: string | null;
  label: string;
  active: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
    links: LaravelPageLink[];
  };
};

export type PublicQuiz = {
  id: number;
  title: string;
  slug: string;
  test_track: "permit_test" | "driving_test";
  total_questions: number;
  duration_seconds: number | null;
  passing_score_percent: number | null;
  is_premium: boolean;
  locked: boolean;
  pass_rate: number | null;
  cover_image_url: string | null;
  category?: { id: number; name: string; title: string };
  quiz_type?: { id: number; name: string; title: string };
  state?: { id: number; code: string; name: string } | null;
  vehicle_type?: { id: number; name: string; title: string } | null;
};

export type PublicAnswerOption = {
  id: number;
  answer_text: string;
};

export type QuizQuestionAssetType = "video" | "audio" | "lottie";

export type PublicQuizQuestionAsset = {
  id: number;
  type: QuizQuestionAssetType;
  url: string | null;
  duration_seconds: number | null;
};

export type PublicQuizQuestion = {
  id: number;
  question_text: string;
  topic: string | null;
  difficulty: QuizDifficulty;
  image_urls: string[];
  assets: PublicQuizQuestionAsset[];
  answers: PublicAnswerOption[];
};

export type QuizShowResponse = {
  quiz: PublicQuiz;
  locked: boolean;
  questions: PublicQuizQuestion[] | null;
};

// Instant per-question feedback (practice mode). Returned by
// POST /quizzes/{quiz}/questions/{question}/check once the learner commits to an answer.
export type QuizAnswerCheckResponse = {
  question_id: number;
  selected_answer_id: number | null;
  correct_answer_id: number | null;
  is_correct: boolean;
  explanation: string | null;
};

// AI tutor reply from POST /quizzes/{quiz}/questions/{question}/assist.
export type QuizAssistResponse = {
  reply: string;
};

export type QuizAttemptStatus = "in_progress" | "completed";

export type QuizAttemptAnswer = {
  question_id: number;
  question_text: string;
  explanation: string | null;
  selected_answer_id: number | null;
  correct_answer_id: number | null;
  is_correct: boolean;
};

export type QuizAttempt = {
  id: number;
  quiz_id: number;
  status: QuizAttemptStatus;
  score: number;
  passed: boolean | null;
  correct_count: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  quiz?: {
    id: number;
    title: string;
    slug: string;
    category: string | null;
  };
  user?: { id: number; name: string; email: string } | null;
  answers?: QuizAttemptAnswer[];
};
