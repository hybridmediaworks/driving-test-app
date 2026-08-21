// GET /ambient-tracks — admin-managed background-music loops for the quiz Settings panel.
// Optional ?category= filters to that category's tracks plus every uncategorized/global track.
export type AmbientTrack = {
  id: number;
  title: string;
  // Null when the track's S3 bucket isn't configured for the current environment.
  url: string | null;
};

export type AmbientTracksResponse = {
  tracks: AmbientTrack[];
};

// Admin CRUD — GET/POST/PUT/DELETE /admin/ambient-tracks
export type AdminAmbientTrack = {
  id: number;
  quiz_category_id: number | null;
  title: string;
  external_url: string | null;
  disk: string | null;
  path: string | null;
  url: string | null;
  is_active: boolean;
  order_no: number;
  created_at: string;
  updated_at: string;
  category?: { id: number; name: string; title: string } | null;
};
