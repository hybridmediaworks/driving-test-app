// The site's "accuracy verified by" trust badge shown on state pages and quiz pages — a single,
// admin-managed profile (see GET /reviewer-profile and the Admin\ReviewerProfileController).
export type ReviewerProfile = {
  name: string;
  title: string;
  // Date string (YYYY-MM-DD) — the last time this reviewer actually re-verified content accuracy.
  verified_at: string;
  photo_url: string | null;
};
