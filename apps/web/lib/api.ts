import { createApiClient, ApiError } from "@driving-test-app/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api";

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
