import { createApiClient, ApiError } from "@driving-test-app/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api/v1";

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

export const api = createApiClient({ baseUrl: API_URL, getToken });

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
