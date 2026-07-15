import type { Metadata } from "next";
import StateLandingPage from "@/components/state/StateLandingPage";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export const metadata: Metadata = {
  title: "DMV Permit Test - Requirements, Study Guide & Practice",
  description:
    "Practice with real exam-like questions that mirror your state's DMV permit test - same format, same difficulty, same tricky answer choices.",
};

export default function StatePage() {
  return (
    <WebLayoutProvider>
      <StateLandingPage />
    </WebLayoutProvider>
  );
}
