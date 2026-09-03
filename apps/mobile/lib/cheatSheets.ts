import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";

/**
 * Opens a cheat sheet's PDF directly for reading (the "Read" CTA). The download endpoint is
 * entitlement-gated and can't receive our bearer token through a browser, so we first ask the API
 * (authenticated) for a short-lived *signed* URL, then open that URL straight in the in-app browser
 * — the PDF opens for reading, no share sheet. A 403 means the sheet is Premium-only, so we route to
 * the paywall.
 */
export async function openCheatSheetPdf(id: string | number): Promise<void> {
  try {
    const { url } = await api.get<{ url: string }>(
      `/cheat-sheets/${id}/download-link`,
    );
    // Open the PDF directly in the in-app browser — no share sheet.
    await WebBrowser.openBrowserAsync(url);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      toast.info("This cheat sheet is part of Premium.");
      router.push("/premium");
      return;
    }
    toast.error("Couldn't open the cheat sheet. Please try again.");
  }
}
