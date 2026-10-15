const PLACEHOLDER_ORIGIN = "https://redirect.invalid";

const AUTH_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/confirm-password",
  "/auth/callback",
];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function safeRedirect(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/")) return null;

  try {
    const url = new URL(target, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN || isAuthPath(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function loginHref(currentPath: string): string {
  const target = safeRedirect(currentPath);
  if (!target || target.split(/[?#]/)[0] === "/") return "/login";
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}
