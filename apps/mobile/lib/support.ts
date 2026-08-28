import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Alert, Platform } from "react-native";

// Where "Report an Issue" sends email. Set EXPO_PUBLIC_SUPPORT_EMAIL in the app's env (same pattern
// as EXPO_PUBLIC_API_URL) to your real support inbox. The example.com fallback is intentionally a
// reserved, non-deliverable placeholder — a build that forgot to configure the address is obvious
// rather than silently mailing a stranger.
export const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "support@example.com";

/**
 * "Report an Issue" — opens the user's mail app with a pre-addressed draft. The body is seeded with
 * the app version, platform and OS version so support isn't stuck asking the basics. Falls back to
 * an alert showing the address (so the user can still reach us) when no mail client can be opened.
 */
export async function reportAnIssue(): Promise<void> {
  const appVersion = Constants.expoConfig?.version ?? "unknown";
  const subject = "DMV Genie — Issue report";
  const body = [
    "Please describe the issue you ran into:",
    "",
    "",
    "———————————————————",
    "The details below help us investigate — please keep them:",
    `App version: ${appVersion}`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
  ].join("\n");

  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Report an issue",
      `We couldn't open your mail app. Please email us at ${SUPPORT_EMAIL}.`,
    );
  }
}
