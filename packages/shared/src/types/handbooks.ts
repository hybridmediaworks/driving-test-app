import type { State, VehicleType } from "./quiz";

export type HandbookSection = {
  id: number;
  heading: string | null;
  content: string;
};

export type HandbookChapter = {
  id: number;
  title: string;
  sections?: HandbookSection[];
};

export type Handbook = {
  id: number;
  state_id: number;
  vehicle_type_id: number;
  language: string;
  title: string;
  source_url: string | null;
  total_words: number | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  state?: State;
  vehicle_type?: VehicleType;
  chapters?: HandbookChapter[];
  chapters_count?: number;
};

export type PublicHandbook = {
  id: number;
  title: string;
  source_url: string | null;
  total_words: number | null;
  pdf_url: string | null;
  state?: { id: number; code: string; name: string } | null;
  vehicle_type?: { id: number; name: string; title: string } | null;
  chapters?: HandbookChapter[];
};
