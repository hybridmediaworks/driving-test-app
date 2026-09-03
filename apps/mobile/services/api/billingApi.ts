import { api } from "@/lib/api";

/**
 * Backend (Stripe/Cashier) subscription management. Used by the Settings page for premium users to
 * cancel or change their plan in-app, rather than bouncing to a store — the right flow for
 * subscriptions that were purchased through the backend rather than the App Store / Play Store.
 * All endpoints require an authenticated, verified user (the api client attaches the bearer token).
 */

/**
 * Cancel the current subscription. Access continues until the end of the current billing period
 * (Cashier's `cancel()`, not `cancelNow()`). Returns the server's confirmation message. Throws an
 * ApiError(422) when there's no active subscription to cancel.
 */
export async function cancelSubscription(): Promise<string> {
  const res = await api.post<{ message: string }>("/billing/subscription/cancel");
  return res.message;
}

/**
 * A Stripe self-service billing portal URL — where the user can change their plan, update the
 * payment method, or cancel. Open it in a browser.
 */
export async function getBillingPortalUrl(): Promise<string> {
  const res = await api.get<{ portal_url: string }>("/billing/portal");
  return res.portal_url;
}
