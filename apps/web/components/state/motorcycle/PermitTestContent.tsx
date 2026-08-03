"use client";

import StatePhase from "@/components/state/StatePhase";
import PremiumCTA from "@/components/state/permit-test/PremiumCTA";
import { useMotorcyclePhaseCompletion } from "@/lib/useMotorcyclePhaseCompletion";
import GoFurtherSection from "./permit-test/GoFurtherSection";
import HeroSection from "./permit-test/HeroSection";
import LiveDataSection from "./permit-test/LiveDataSection";
import ReviewAccuracy from "./permit-test/ReviewAccuracy";

export default function PermitTestContent() {
  return (
    <>
      <HeroSection />
      <LiveDataSection />
      <section className="md:px-15 px-5 pt-15 pb-15 lg:pt-30 lg:pb-15 bg-background2">
        <div className="mx-auto max-w-container space-y-12">
          <StatePhase phase={1} nextConnector usePhaseData={useMotorcyclePhaseCompletion} />
          <StatePhase phase={2} previousConnector nextConnector usePhaseData={useMotorcyclePhaseCompletion} />
          <PremiumCTA previousConnector nextConnector afterPhase={2} usePhaseData={useMotorcyclePhaseCompletion} />
          <StatePhase phase={3} nextConnector usePhaseData={useMotorcyclePhaseCompletion} />
          <StatePhase phase={4} previousConnector nextConnector usePhaseData={useMotorcyclePhaseCompletion} />
          <StatePhase phase={5} previousConnector nextConnector usePhaseData={useMotorcyclePhaseCompletion} />
          <PremiumCTA previousConnector nextConnector afterPhase={5} usePhaseData={useMotorcyclePhaseCompletion} />
          <StatePhase phase={6} nextConnector usePhaseData={useMotorcyclePhaseCompletion} />
          <StatePhase phase={7} previousConnector usePhaseData={useMotorcyclePhaseCompletion} />
        </div>
      </section>
      <ReviewAccuracy />
      <GoFurtherSection />
    </>
  );
}
