// The "verified by" reviewer roster. Each expert has a compact trust-badge shape shown on state
// and quiz pages (ExpertSummary) and a full public profile at /experts/{slug} (Expert).
// Admin-managed — see GET /experts, GET /experts/{slug}, and the Admin\ExpertController.

export type ExpertSection = {
  heading: string;
  // Plain text. Blank line separates paragraphs; a line starting with "- " is a bullet.
  body: string;
};

// Compact shape returned by GET /experts — everything the trust badge renders plus the slug.
export type ExpertSummary = {
  slug: string;
  name: string;
  title: string;
  credentials: string | null;
  role_label: string | null;
  // Date string (YYYY-MM-DD) — the last time this reviewer re-verified content accuracy.
  verified_at: string;
  photo_url: string | null;
};

// Full profile returned by GET /experts/{slug}.
export type Expert = ExpertSummary & {
  intro: string | null;
  linkedin_url: string | null;
  email: string | null;
  sections: ExpertSection[];
};

// Admin shape from GET /admin/experts and /admin/experts/{id}.
export type AdminExpert = Expert & {
  id: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
