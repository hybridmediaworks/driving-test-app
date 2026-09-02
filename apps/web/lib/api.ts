import { createApiClient, ApiError } from "@driving-test-app/shared";

const REMOTE_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api/v1";

// The API's CORS policy only allows its own origin, so a browser request straight to
// REMOTE_API_URL from the app's origin is blocked. In the browser we call a same-origin path that
// next.config.ts rewrites to the real API (proxied server-side, where CORS doesn't apply). On the
// server we hit the API directly — there's no origin to proxy through, and a relative URL has
// nothing to resolve against.
const API_URL = typeof window === "undefined" ? REMOTE_API_URL : "/backend-api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

// Persistent anonymous identity, generated once per browser and reused for every request — lets a
// guest's in-progress quiz attempt be found again after closing the tab, without requiring signup.
function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = localStorage.getItem("guest_token");
    if (existing) return existing;
    const generated = crypto.randomUUID();
    localStorage.setItem("guest_token", generated);
    return generated;
  } catch {
    // Private-mode / storage-disabled — the request just goes out without a guest identity, same
    // as before this feature existed.
    return null;
  }
}

export const api = createApiClient({ baseUrl: API_URL, getToken, getGuestToken });

export { ApiError };

/**
 * Downloads a binary file (e.g. a cheat-sheet PDF) via an authenticated fetch, rather than a
 * plain `<a href>` — this app's auth is a Bearer token in localStorage, not a cookie, so a bare
 * link navigation to a protected endpoint can't attach the Authorization header at all. Works
 * for guest-accessible downloads too (the header is simply omitted when there's no token).
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.message ?? "Download failed", data?.errors);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
