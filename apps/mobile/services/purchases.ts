import Constants from "expo-constants";
import { Platform } from "react-native";
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

/**
 * RevenueCat (App Store / Google Play) subscriptions — the store-compliant way to sell premium on
 * mobile. The backend still owns entitlement (RevenueCat's webhook writes `revenuecat_premium_until`
 * and EntitlementResolver reads it), so this layer only drives the native purchase UI and reports
 * status back for instant feedback.
 *
 * Expo Go can't load native modules, so everything is lazy + guarded: `isAvailable()` is false in
 * Expo Go or when keys aren't configured, and the native SDK is only imported when actually used.
 * The rest of the app calls these helpers and no-ops gracefully where purchases aren't available.
 */

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
// The RevenueCat entitlement identifier that represents "premium" (configured in the dashboard).
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? "premium";

// executionEnvironment is "storeClient" inside Expo Go, where native modules (and RevenueCat) don't
// exist. Dev/prod builds report "standalone"/"bare".
const isExpoGo = Constants.executionEnvironment === "storeClient";

const apiKey = Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY;

/** True only where a real purchase can happen: a dev/prod build with the platform's key configured. */
export function isAvailable(): boolean {
  return !isExpoGo && !!apiKey;
}

type PurchasesModule = typeof import("react-native-purchases").default;

let Purchases: PurchasesModule | null = null;
let configuredForUser: string | null | undefined; // undefined = never configured

async function load(): Promise<PurchasesModule | null> {
  if (!isAvailable()) return null;
  if (!Purchases) {
    Purchases = (await import("react-native-purchases")).default;
  }
  return Purchases;
}

/**
 * Configure the SDK and tie purchases to our backend user id (RevenueCat's `app_user_id`), so its
 * webhook maps straight back to the User. Safe to call repeatedly (e.g. on login / app resume).
 */
export async function configure(userId?: string): Promise<void> {
  const rc = await load();
  if (!rc) return;

  if (configuredForUser === undefined) {
    rc.configure({ apiKey: apiKey!, appUserID: userId ?? null });
    configuredForUser = userId ?? null;
  } else if (userId && userId !== configuredForUser) {
    await rc.logIn(userId);
    configuredForUser = userId;
  }
}

/** The current offering (the set of subscription packages to show), or null when unavailable. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const rc = await load();
  if (!rc) return null;
  await configure();
  const offerings = await rc.getOfferings();
  return offerings.current ?? null;
}

/** True if the RevenueCat "premium" entitlement is active for the current customer. */
export async function isPremiumActive(): Promise<boolean> {
  const rc = await load();
  if (!rc) return false;
  await configure();
  const info = await rc.getCustomerInfo();
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

/**
 * Buy a package (defaults to the current offering's default/first package). Returns the resulting
 * premium status. Throws on real failures; a user cancel resolves to `{ cancelled: true }`.
 */
export async function purchase(
  pkg?: PurchasesPackage,
): Promise<{ cancelled: boolean; isPremium: boolean }> {
  const rc = await load();
  if (!rc) return { cancelled: false, isPremium: false };
  await configure();

  const target =
    pkg ??
    (await getCurrentOffering())?.availablePackages[0] ??
    null;
  if (!target) throw new Error("No subscription package is available to purchase.");

  try {
    const { customerInfo } = await rc.purchasePackage(target);
    return {
      cancelled: false,
      isPremium: customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined,
    };
  } catch (e) {
    if (isUserCancelled(e)) return { cancelled: true, isPremium: false };
    throw e;
  }
}

/** Restore prior purchases (App Store requires a visible "Restore" action). */
export async function restore(): Promise<{ isPremium: boolean }> {
  const rc = await load();
  if (!rc) return { isPremium: false };
  await configure();
  const info: CustomerInfo = await rc.restorePurchases();
  return { isPremium: info.entitlements.active[ENTITLEMENT_ID] !== undefined };
}

/** Detach the current user's purchases (call on logout). */
export async function logOut(): Promise<void> {
  const rc = await load();
  if (!rc || configuredForUser == null) return;
  try {
    await rc.logOut();
  } catch {
    // logOut throws for an anonymous user — harmless.
  }
  configuredForUser = null;
}

function isUserCancelled(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { userCancelled?: boolean }).userCancelled === true
  );
}
