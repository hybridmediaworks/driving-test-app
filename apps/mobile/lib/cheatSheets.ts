import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";

/**
 * Downloads the file into the app and opens the native viewer/share sheet — no browser tab.
 * expo-file-system + expo-sharing are native modules that only exist in a rebuilt dev/prod client,
 * so they're imported lazily and any failure (e.g. a client that hasn't been rebuilt yet) returns
 * false so the caller can fall back to the browser rather than crashing the app.
 */
async function downloadInApp(url: string, id: string | number): Promise<boolean> {
  try {
    // require() (not import) so Metro evaluates these lazily — a client without the native modules
    // throws here and we fall back to the browser, instead of crashing at app startup.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FileSystem = require("expo-file-system/legacy") as typeof import("expo-file-system/legacy");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sharing = require("expo-sharing") as typeof import("expo-sharing");

    const fileUri = `${FileSystem.cacheDirectory}cheat-sheet-${id}.pdf`;
    const { uri, status } = await FileSystem.downloadAsync(url, fileUri);
    if (status !== 200) return false;

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Cheat sheet",
      });
    } else {
      toast.success("Cheat sheet downloaded");
    }
    return true;
  } catch {
    return false;
  }
}

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
    if (!(await downloadInApp(url, id))) {
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
