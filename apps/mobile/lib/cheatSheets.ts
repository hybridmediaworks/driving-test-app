import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { api, ApiError } from "@/lib/api";
import { downloadPdfInApp } from "@/lib/pdf";
import { toast } from "@/store/toastStore";

/**
 * Opens a cheat sheet's PDF. The download endpoint is entitlement-gated and can't receive our bearer
 * token through a browser, so we first ask the API (authenticated) for a short-lived *signed* URL,
 * then download it into the app. A 403 means the sheet is Premium-only, so we route to the paywall.
 */
export async function openCheatSheetPdf(id: string | number): Promise<void> {
  try {
    const { url } = await api.get<{ url: string }>(
      `/cheat-sheets/${id}/download-link`,
    );
    // Prefer an in-app download; fall back to the browser only if the native modules aren't
    // available yet (client not rebuilt), so the button always does something.
    if (!(await downloadPdfInApp(url, `cheat-sheet-${id}`, "Cheat sheet"))) {
      await WebBrowser.openBrowserAsync(url);
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      toast.info("This cheat sheet is part of Premium.");
      router.push("/premium");
      return;
    }
    toast.error("Couldn't open the cheat sheet. Please try again.");
  }
}
