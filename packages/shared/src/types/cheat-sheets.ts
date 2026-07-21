import type { QuizCategory, State, VehicleType } from "./quiz";

export type CheatSheetSection = {
  id: number;
  heading: string;
  body_markdown: string;
  sort_order: number;
};

export type CheatSheet = {
  id: number;
  quiz_category_id: number | null;
  state_id: number | null;
  vehicle_type_id: number | null;
  title: string;
  slug: string;
  summary: string;
  order_no: number;
  is_premium: boolean;
  is_active: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  category?: QuizCategory | null;
  state?: State | null;
  vehicle_type?: VehicleType | null;
  sections?: CheatSheetSection[];
  sections_count?: number;
};

export type PublicCheatSheet = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  is_premium: boolean;
  cover_image_url: string | null;
  category?: { id: number; name: string; title: string } | null;
  state?: { id: number; code: string; name: string } | null;
  vehicle_type?: { id: number; name: string; title: string } | null;
};

export type PublicCheatSheetSection = {
  id: number;
  heading: string;
  body_markdown: string;
};

export type CheatSheetShowResponse = {
  cheat_sheet: PublicCheatSheet;
  locked: boolean;
  sections: PublicCheatSheetSection[] | null;
};
