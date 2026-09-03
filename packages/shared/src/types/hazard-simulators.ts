import type { PaginatedResponse, State, VehicleType } from "./quiz";

export type HazardType = "sign" | "pedestrian" | "vehicle" | "signal" | "road_mark";

export type HazardBox = { x: number; y: number; w: number; h: number };

/** Teaser shape — safe to show a locked (non-entitled) caller. */
export type PublicHazardSimulator = {
  id: number;
  slug: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_premium: boolean;
  locked: boolean;
  test_level: string | null;
  test_location: string | null;
  test_number: string | null;
  hazard_count: number;
  demo_hazard_count: number;
  pass_threshold_percent: number | null;
  categories?: HazardType[];
  section: string | null;
  state?: { id: number; code: string; name: string } | null;
  vehicle_type?: { id: number; name: string; title: string } | null;
};

/** A demo (taught) hazard, sent in full in the playback manifest, and any hazard in a graded breakdown. */
export type ManifestHazard = {
  id: number;
  type: HazardType;
  type_label: string;
  group: number | null;
  mode: "demo" | "assessment";
  time_start: number;
  time_end: number;
  box: HazardBox;
  comment: string | null;
  audio_url: string | null;
};

/** Playback manifest — present only when the caller may attempt (free simulator, or premium + entitled). */
export type HazardManifest = {
  provider: string;
  provider_video_id: string | null;
  embed_url: string | null;
  duration_seconds: number | null;
  scored_hazard_count: number;
  demo_hazard_count: number;
  pass_threshold_percent: number | null;
  handoff_after_seconds: number | null;
  first_assessment_seconds: number | null;
  demo_hazards: ManifestHazard[];
};

export type HazardSimulatorShowResponse = {
  simulator: PublicHazardSimulator;
  locked: boolean;
  manifest: HazardManifest | null;
};

export type StartHazardAttemptResponse = {
  attempt: { id: number; started_at: string; hazards_total: number };
  guest_token: string | null;
};

/** One raw click during the scored phase, submitted for grading. */
export type HazardClickEvent = { video_ms: number; x: number | null; y: number | null };

/** Live hit/miss feedback for a single scored-phase click. */
export type HazardMarkResponse = {
  hit: boolean;
  absorbed: boolean;
  hazard: {
    id: number;
    type: HazardType;
    type_label: string;
    comment: string | null;
    audio_url: string | null;
    time_start: number;
    time_end: number;
  } | null;
};

export type HazardBreakdownItem = {
  hazard_id: number;
  type: HazardType;
  type_label: string;
  mode: "demo" | "assessment";
  spotted: boolean;
  auto_credited: boolean;
  reaction_ms: number | null;
  time_start: number;
  time_end: number;
  seek_to: number;
  comment: string | null;
  audio_url: string | null;
  box: HazardBox;
};

export type HazardReactionBand = "fast" | "average" | "slow";

export type HazardSimulatorAttempt = {
  id: number;
  hazard_simulator_id: number;
  status: "in_progress" | "completed" | "abandoned";
  score: number | null;
  passed: boolean | null;
  hazards_spotted: number;
  hazards_total: number;
  avg_reaction_ms: number | null;
  reaction_band: HazardReactionBand | null;
  false_clicks: number;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  simulator?: {
    id: number;
    slug: string;
    title: string | null;
    thumbnail_url: string | null;
  };
  user?: { id: number; name: string; email: string } | null;
  breakdown?: HazardBreakdownItem[];
};

export type HazardAttemptSubmitResponse = { attempt: HazardSimulatorAttempt };

// ---------------------------------------------------------------------------
// Admin shapes (flat, ungated) — /admin/hazard-simulators
// ---------------------------------------------------------------------------

export type AdminHazard = {
  id: number;
  hazard_simulator_id: number;
  source_hazard_id: number | null;
  type: HazardType;
  type_raw: string | null;
  type_label: string;
  hazard_group: number | null;
  mode: "demo" | "assessment";
  in_timeline: boolean;
  sort_order: number | null;
  time_start: number;
  time_end: number;
  frame_count: number;
  box: HazardBox | null;
  comment: string | null;
  audio_url: string | null;
  audio_disk: string | null;
  audio_path: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminHazardSimulator = {
  id: number;
  video_id: number;
  slug: string;
  sim_id: number | null;
  page_id: number | null;
  provider: string;
  provider_video_id: string | null;
  test_level: string | null;
  test_location: string | null;
  test_number: string | null;
  hazard_count: number;
  demo_hazard_count: number;
  pass_threshold_percent: number | null;
  scoring_profile: string;
  is_active: boolean;
  content_locked: boolean;
  created_at: string;
  updated_at: string;
  hazards_count?: number;
  attempts_count?: number;
  video?: {
    id: number;
    title: string;
    thumbnail_url: string | null;
    is_premium: boolean;
    is_active: boolean;
    section: string | null;
    state: { id: number; code: string; name: string } | null;
    vehicle_type: { id: number; name: string; title: string } | null;
  } | null;
  hazards?: AdminHazard[];
};

export type HazardSpotRate = {
  hazard_id: number;
  type: HazardType;
  comment: string | null;
  hits: number;
  misses: number;
  total: number;
  miss_rate: number;
};

export type AdminHazardSimulatorsResponse = {
  hazard_simulators: PaginatedResponse<AdminHazardSimulator>;
  states: State[];
  vehicle_types: VehicleType[];
};

export type AdminHazardSimulatorShowResponse = {
  hazard_simulator: AdminHazardSimulator;
  hazard_stats: HazardSpotRate[];
  recent_attempts: HazardSimulatorAttempt[];
  scoring_profiles: string[];
};

export type AdminHazardsResponse = {
  hazard_simulator: AdminHazardSimulator;
  hazards: AdminHazard[];
};
