import type { User } from "@driving-test-app/shared";

export const EMAIL_UNVERIFIED_COOKIE = "email_unverified";

const UNVERIFIED_ALLOWED_PATHS = ["/verify-email", "/auth/callback", "/reset-password", "/unsubscribe"];

export function isAllowedUnverified(pathname: string): boolean {
  return UNVERIFIED_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function syncEmailUnverifiedCookie(user: User | null): void {
  if (typeof document === "undefined") return;
  document.cookie =
    user && !user.email_verified_at
      ? `${EMAIL_UNVERIFIED_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`
      : `${EMAIL_UNVERIFIED_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
