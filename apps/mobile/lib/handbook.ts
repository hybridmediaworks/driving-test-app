import * as WebBrowser from "expo-web-browser";

import { api } from "@/lib/api";
import { toast } from "@/store/toastStore";

type Handbook = {
  id: number;
  title: string;
  source_url: string | null;
  pdf_url: string | null;
};

/**
 * Opens the official driver's handbook for the given state/vehicle — the "Read" CTA on the
 * Progress tab's Manual row. Handbooks aren't premium-gated. Opens the PDF directly in the in-app
 * browser (no share sheet); falls back to the source web page when there's no direct PDF. Toasts
 * when no handbook exists for the state yet.
 */
export async function openManual(vehicle: string, state: string): Promise<void> {
  try {
    const res = await api.get<{ data: Handbook[] }>(
      `/handbooks?state=${encodeURIComponent(state)}&vehicle_type=${encodeURIComponent(vehicle)}`,
    );
    const handbook = res.data?.[0];
    const pdf = handbook?.pdf_url;
    const source = handbook?.source_url;

    if (pdf) {
      // Open the PDF directly in the in-app browser — no share sheet.
      await WebBrowser.openBrowserAsync(pdf);
      return;
    }
    if (source) {
      await WebBrowser.openBrowserAsync(source);
      return;
    }
    toast.info("The driver's manual isn't available for your state yet.");
  } catch {
    toast.error("Couldn't open the manual. Please try again.");
  }
}
