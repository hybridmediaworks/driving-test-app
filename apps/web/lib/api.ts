import { createApiClient, ApiError } from "@driving-test-app/shared";

// The browser and the server both call the API directly at NEXT_PUBLIC_API_URL. In production the
// web app and the API share an origin, so browser calls are same-origin (no CORS). NEXT_PUBLIC_ is
// inlined at build time, so it must be set to the public API URL the browser can reach.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api/v1";

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

// `crypto.randomUUID` only exists in secure contexts (HTTPS / localhost), so on a plain-HTTP host
// (e.g. an IP-addressed staging server) it is undefined and would silently disable guest resume.
// `crypto.getRandomValues` is available on insecure origins too, so fall back to a v4 UUID built
// from it.
function generateUuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Persistent anonymous identity, generated once per browser and reused for every request — lets a
// guest's in-progress quiz attempt be found again after closing the tab, without requiring signup.
function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = localStorage.getItem("guest_token");
    if (existing) return existing;
    const generated = generateUuid();
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
