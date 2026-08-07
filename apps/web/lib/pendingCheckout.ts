const STORAGE_KEY = "pending_checkout_plan_key";

/**
 * A guest who clicks "Get Weekly" etc. gets sent through a login/register detour before landing
 * back in checkout — /login and /register carry a `redirect` URL param for that. But if they
 * instead go check their email and click the verification link, that link is a server-generated
 * URL (signed by Laravel) with no way for us to embed our own params in it — it opens with zero
 * route context. localStorage bridges that gap: it survives navigating away to email and back,
 * scoped to this browser (so it's a no-op, not a crash, if verified from a different device).
 */
export function setPendingCheckoutPlan(planKey: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, planKey);
  } catch {
    // Storage unavailable (private browsing etc.) — the URL `redirect` param still covers the
    // synchronous login/register path, so this is a soft failure, not a broken flow.
  }
}

/** Reads and clears in one step — a pending checkout is meant to be resumed exactly once. */
export function consumePendingCheckoutPlan(): string | null {
  try {
    const key = window.localStorage.getItem(STORAGE_KEY);
    if (key) window.localStorage.removeItem(STORAGE_KEY);
    return key;
  } catch {
    return null;
  }
}
