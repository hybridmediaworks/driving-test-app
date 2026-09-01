import type { Expert } from "@driving-test-app/shared";

// Server-side code runs inside the same container as Laravel, so it always talks to it directly
// on localhost — NEXT_PUBLIC_API_URL is a relative path ("/api/v1") meant for the browser to hit
// through nginx, and is invalid as a URL for Node's server-side fetch.
const API_URL = "http://127.0.0.1:8001/api/v1";

/**
 * Server-side fetch of a single public expert profile for /experts/{slug} (metadata + page body).
 * Returns null for a 404 or any transport error so the route can render notFound() rather than
 * crash. Not cached — an admin edit (new photo, copy change) must show on the next reload; the
 * page is low-traffic so a fetch per render is fine.
 */
export async function fetchExpert(slug: string): Promise<Expert | null> {
  try {
    const res = await fetch(`${API_URL}/experts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.expert as Expert) ?? null;
  } catch {
    return null;
  }
}
