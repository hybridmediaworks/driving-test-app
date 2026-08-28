import * as Linking from "expo-linking";
import * as StoreReview from "expo-store-review";
import { Alert, Platform } from "react-native";

// Android application id (from app.json) — used to deep-link straight to the Play Store listing.
const ANDROID_PACKAGE = "com.tassawer2008.drivingtest";

/**
 * "Leave a Review" / "Enjoying DMV Genie?" — opens the app's store listing so the user can rate it.
 *
 * We intentionally open the store page rather than the native in-app review sheet
 * (StoreReview.requestReview). That API is *silent* in dev and sideloaded builds and is heavily
 * rate-limited even in production, so an explicit button wired to it looks broken ("nothing
 * happens") — which is exactly what it does off the Play Store. Deep-linking to the store always
 * gives the user visible feedback and lets them actually write a review.
 *
 * Note: this only lands on a real listing once the app is published. Before then the store will
 * open on a "not found" page — that's expected, and confirms the button itself works.
 */
export async function requestAppRating(): Promise<void> {
  // First entry opens the native store app; second is the browser fallback.
  const candidates: (string | null)[] =
    Platform.OS === "android"
      ? [
          `market://details?id=${ANDROID_PACKAGE}`,
          `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
        ]
      : // iOS: expo-store-review builds the App Store URL once an App Store ID is set in app.json.
        [StoreReview.storeUrl()];

  for (const url of candidates) {
    if (!url) continue;
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // Try the next candidate (e.g. no Play Store app -> fall back to the web listing).
    }
  }

  // Nothing could be opened — tell the user instead of failing silently.
  Alert.alert(
    "Couldn't open the store",
    "Please search for DMV Genie in your app store to leave a review.",
  );
}
