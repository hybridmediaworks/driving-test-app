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
};

export type State = {
  id: number;
  code: string;
  name: string;
};

export type VehicleType = {
  id: number;
  name: string;
  title: string;
  is_active: boolean;
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
  order_no: number;
  cover_image_path: string | null;
  cover_image_url: string | null;
  test_track: "permit_test" | "driving_test";
  total_questions: number;
  duration_seconds: number | null;
  is_premium: boolean;
  is_active: boolean;
  category?: QuizCategory;
  quizType?: QuizType;
  state?: State;
  vehicleType?: VehicleType;
  quiz_questions_count?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};
