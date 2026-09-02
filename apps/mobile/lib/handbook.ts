import * as WebBrowser from "expo-web-browser";

import { api } from "@/lib/api";
import { downloadPdfInApp } from "@/lib/pdf";
import { toast } from "@/store/toastStore";

type Handbook = {
  id: number;
  title: string;
  source_url: string | null;
  pdf_url: string | null;
};

/**
 * Opens the official driver's handbook for the given state/vehicle — the "Get it" CTA on the
 * Progress tab's Manual row. Handbooks aren't premium-gated. Prefers an in-app PDF download +
 * native viewer (stays in the app); falls back to the browser only when the PDF can't be fetched
 * in-app, or when there's only a source web page. Toasts when no handbook exists for the state yet.
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
      // In-app download + native viewer; browser only if the native download isn't available.
      if (!(await downloadPdfInApp(pdf, `manual-${state}-${vehicle}`, handbook?.title ?? "Manual"))) {
        await WebBrowser.openBrowserAsync(pdf);
      }
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
