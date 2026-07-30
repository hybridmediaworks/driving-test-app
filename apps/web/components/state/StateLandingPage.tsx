"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import DrivingTests from "@/components/state/DrivingTests";
import LineChart from "@/components/state/LineChart";
import {
  isValidState,
  slugToStateName,
  stateAbbreviations,
  stateToSlug,
} from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function StateLandingPage({ state = "" }: { state?: string }) {
  const router = useRouter();
  // WebLayoutProvider is rendered by the page's root, so `selectedState` acts
  // as a fallback only when the route itself doesn't carry a state slug.
  const { selectedState, selectedVehicle, selectedTestType } = useWebLayout();

  const propStateName = state ? slugToStateName(state) : "";
  const stateName =
    (isValidState(propStateName) ? propStateName : "") ||
    selectedState ||
    "Oregon";
  const stateAbbr = stateAbbreviations[stateName] || "OR";
  const stateSlug = state || stateToSlug(stateName);

  function goToWrittenTest() {
    router.push(`/${stateSlug}/dmv-written-test`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="states" />
      <main className="flex-1">
        <section className="px-3.5 py-10">
          <div className="mx-auto max-w-container">
            <DrivingTests stateCode={stateAbbr} stateName={stateName} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
