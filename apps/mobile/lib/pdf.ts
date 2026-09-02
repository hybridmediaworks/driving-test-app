import { toast } from "@/store/toastStore";

/**
 * Downloads a PDF into the app's cache and opens the native viewer / share sheet — keeps the user
 * inside the app instead of bouncing to a browser tab.
 *
 * expo-file-system + expo-sharing are required lazily so a client that doesn't include them (or any
 * failure mid-download) returns `false`, letting the caller fall back to the browser rather than
 * crashing.
 */
export async function downloadPdfInApp(
  url: string,
  fileName: string,
  dialogTitle = "Document",
): Promise<boolean> {
  try {
    // require() (not import) so Metro evaluates these lazily — a client without the native modules
    // throws here and we fall back, instead of crashing at app startup.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FileSystem = require("expo-file-system/legacy") as typeof import("expo-file-system/legacy");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sharing = require("expo-sharing") as typeof import("expo-sharing");

    const safeName = fileName.replace(/[^a-z0-9._-]/gi, "-");
    const fileUri = `${FileSystem.cacheDirectory}${safeName}.pdf`;
    const { uri, status } = await FileSystem.downloadAsync(url, fileUri);
    if (status !== 200) return false;

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle,
      });
    } else {
      toast.success("Downloaded");
    }
    return true;
  } catch {
    return false;
  }
}
