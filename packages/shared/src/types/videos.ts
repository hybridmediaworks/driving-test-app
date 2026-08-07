import type { QuizCategory, State, VehicleType } from "./quiz";

export type Video = {
  id: number;
  quiz_category_id: number | null;
  state_id: number | null;
  vehicle_type_id: number | null;
  test_track: "permit_test" | "driving_test" | null;
  section: string | null;
  subsection: string | null;
  title: string;
  slug: string;
  description: string | null;
  duration_seconds: number | null;
  source_url: string | null;
  external_url: string | null;
  disk: string | null;
  path: string | null;
  url: string | null;
  is_premium: boolean;
  is_active: boolean;
  order_no: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  category?: QuizCategory | null;
  state?: State | null;
  vehicle_type?: VehicleType | null;
};

export type PublicVideo = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  duration_seconds: number | null;
  is_premium: boolean;
  locked: boolean;
  thumbnail_url: string | null;
  test_track: "permit_test" | "driving_test" | null;
  section: string | null;
  subsection: string | null;
  category?: { id: number; name: string; title: string } | null;
  state?: { id: number; code: string; name: string } | null;
  vehicle_type?: { id: number; name: string; title: string } | null;
};

export type VideoShowResponse = {
  video: PublicVideo;
  locked: boolean;
  url: string | null;
};
