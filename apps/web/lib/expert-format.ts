// Plain (non-"use client") date helpers for the reviewer badge and the /experts/{slug} profile
// page — kept out of useExperts.ts so a Server Component can import them without pulling in a
// client module.

/** Formats a YYYY-MM-DD date string as "Jan 2026", matching the trust-badge copy's style. */
export function formatVerifiedMonth(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Formats a YYYY-MM-DD date string as "January 12, 2026" — the long form used on the profile page. */
export function formatVerifiedDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
