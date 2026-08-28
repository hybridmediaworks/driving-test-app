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
  // A representative question image for listing cards — only present on the public /quizzes list
  // endpoint (where the relation is eager-loaded), absent from the single-quiz show response.
  preview_image_url?: string | null;
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
  // Whether the current user has already completed this quiz — only present on the public /quizzes
  // list endpoint (false for guests / on the single-quiz show response). Drives the progressive
  // "finish one to unlock the next" ladder on the frontend.
  attempted?: boolean;
  // The current user's pass/fail outcome for this quiz against the pass line (passing_score_percent
  // ?? 80): true = passed, false = failed, null = not attempted (also for guests / show response).
  // Drives the pass (green tick) / fail (red mark) badge on the ladder card.
  user_passed?: boolean | null;
  // Server-resolved progressive-ladder lock state (only on a full ladder request — state +
  // vehicle_type + test_track): null = open, "premium" = not entitled (route to /pricing),
  // "progress" = entitled but the previous quiz isn't finished yet (locked silently).
  lock_reason?: "premium" | "progress" | null;
  // Whether this is the single quiz the learner should take now (the first open, not-yet-completed
  // one). Only meaningful on a full ladder request; false otherwise.
  is_next?: boolean;
  // Real pass rate (0-100) from graded quiz_attempts, null when there's no real attempt data yet
  // — show nothing rather than a misleading 0%. Same "only present from the public endpoint" note
  // as `locked` above.
  pass_rate?: number | null;
  // Present (non-null) when this caller (user, or guest via X-Guest-Token) has a resumable
  // in-progress attempt on this quiz — drives the "Continue (x/y)" CTA instead of "Start". Same
  // "only from the public endpoint, requires a resolvable identity" scoping as `attempted` above.
  in_progress?: { answered: number; total: number } | null;
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
  // Present (non-null) when this caller (user, or guest via X-Guest-Token) has a resumable
  // in-progress attempt on this quiz — drives the "Continue (x/y)" CTA instead of "Start".
  in_progress: { answered: number; total: number } | null;
  cover_image_url: string | null;
  // A representative question image for listing cards — only present on the public /quizzes list
  // endpoint (where the relation is eager-loaded), absent from the single-quiz show response.
  preview_image_url?: string | null;
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

// "en" unless a non-English `language` was requested AND actually available — falls back to
// "en" (not the requested locale) whenever translation isn't configured/cached/successful, so the
// client always knows what was actually served, not just what was asked for.
export type ContentLanguage = "en" | "es" | "ru";

export type QuizShowResponse = {
  quiz: PublicQuiz;
  locked: boolean;
  questions: PublicQuizQuestion[] | null;
  content_language: ContentLanguage;
};

// Instant per-question feedback (practice mode). Returned by
// POST /quizzes/{quiz}/questions/{question}/check once the learner commits to an answer.
export type QuizAnswerCheckResponse = {
  question_id: number;
  selected_answer_id: number | null;
  correct_answer_id: number | null;
  is_correct: boolean;
  explanation: string | null;
  // Null until at least one attempt has been submitted for this question.
  answer_popularity: { answer_id: number; percentage: number }[] | null;
};

// AI tutor reply from POST /quizzes/{quiz}/questions/{question}/assist.
export type QuizAssistResponse = {
  reply: string;
};

// Response from POST /quizzes/{quiz}/attempts/start — either resumes the caller's existing
// in-progress attempt on this quiz (from within the last 7 days) or starts a fresh one.
// `question_order` is the question id order to render in — captured once at start time so a
// resumed attempt reattaches to the exact same order. `answers`, keyed by question id, is shaped
// exactly like QuizAnswerCheckResponse — one entry per question already answered in this attempt.
export type QuizAttemptStartResponse = {
  attempt: {
    id: number;
    question_order: number[];
    started_at: string;
    total_questions: number;
  };
  answers: Record<number, QuizAnswerCheckResponse>;
  // Only present for a guest caller — the identity (existing or newly generated) this attempt is
  // keyed to. The web client already persists this itself (see lib/api.ts's getGuestToken), so
  // it's mainly a defensive fallback rather than something callers need to act on.
  guest_token: string | null;
};

// Results-screen insight from POST /quizzes/{quiz}/results-insight — weak areas grounded on the
// missed questions' topics, plus a short dynamic coach message.
export type QuizResultsInsightResponse = {
  weak_areas: string[];
  message: string;
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
