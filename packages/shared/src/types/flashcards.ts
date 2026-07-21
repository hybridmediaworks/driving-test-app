import type { QuizCategory, State, VehicleType } from "./quiz";

export type FlashcardReviewStatus = "new" | "known" | "unknown";

export type Flashcard = {
  id: number;
  quiz_category_id: number | null;
  state_id: number | null;
  vehicle_type_id: number | null;
  front_text: string;
  back_text: string;
  topic: string | null;
  sort_order: number;
  is_premium: boolean;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category?: QuizCategory | null;
  state?: State | null;
  vehicle_type?: VehicleType | null;
};

export type PublicFlashcard = {
  id: number;
  front_text: string;
  back_text: string | null;
  image_url: string | null;
  topic: string | null;
  is_premium: boolean;
  locked: boolean;
  category?: { id: number; name: string; title: string } | null;
  state?: { id: number; code: string; name: string } | null;
  vehicle_type?: { id: number; name: string; title: string } | null;
};

export type FlashcardReview = {
  flashcard_id: number;
  status: FlashcardReviewStatus;
  reviewed_at: string | null;
};
