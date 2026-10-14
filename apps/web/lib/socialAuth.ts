import type { SocialAuthError, SocialProvider } from "@driving-test-app/shared";
import { API_URL } from "./api";

const REDIRECT_KEY = "social_auth_redirect";

function safeRedirect(redirect: string | null): string | null {
  return redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
}

export function startSocialLogin(provider: SocialProvider, redirect: string | null): void {
  try {
    const target = safeRedirect(redirect);
    if (target) {
      sessionStorage.setItem(REDIRECT_KEY, target);
    } else {
      sessionStorage.removeItem(REDIRECT_KEY);
    }
  } catch {
  }
  window.location.assign(`${API_URL}/auth/${provider}/redirect`);
}

export function takeSocialRedirect(): string | null {
  try {
    const redirect = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return safeRedirect(redirect);
  } catch {
    return null;
  }
}

const ERROR_MESSAGES: Record<SocialAuthError, string> = {
  cancelled: "Sign-in was cancelled.",
  invalid_state: "Your sign-in attempt expired. Please try again.",
  email_missing: "We couldn’t get an email address from that account. Please try another way to sign in.",
  email_in_use: "An account with this email already exists. Sign in the way you did before — with your password or the provider you used.",
  unavailable: "That sign-in option isn’t available right now.",
  failed: "Something went wrong signing you in. Please try again.",
};

export function socialErrorMessage(error: string | null): string | null {
  if (!error) return null;
  return ERROR_MESSAGES[error as SocialAuthError] ?? ERROR_MESSAGES.failed;
}
