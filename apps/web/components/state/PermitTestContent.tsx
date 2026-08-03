"use client";

import GoFurtherSection from "@/components/state/permit-test/GoFurtherSection";
import HeroSection from "@/components/state/permit-test/HeroSection";
import LiveDataSection from "@/components/state/permit-test/LiveDataSection";
import PremiumCTA from "@/components/state/permit-test/PremiumCTA";
import ReviewAccuracy from "@/components/state/permit-test/ReviewAccuracy";
import StatePhase from "@/components/state/StatePhase";

export default function PermitTestContent() {
  return (
    <>
      <HeroSection />
      <LiveDataSection />
      <section className="md:px-15 px-5 pt-15 pb-15 lg:pt-30 lg:pb-15 bg-background2">
        <div className="mx-auto max-w-container space-y-12">
          <StatePhase phase={1} nextConnector />
          <StatePhase phase={2} previousConnector nextConnector />
          <PremiumCTA previousConnector nextConnector afterPhase={2} />
          <StatePhase phase={3} nextConnector />
          <StatePhase phase={4} previousConnector nextConnector />
          <StatePhase phase={5} previousConnector nextConnector />
          <PremiumCTA previousConnector nextConnector afterPhase={5} />
          <StatePhase phase={6} nextConnector />
          <StatePhase phase={7} previousConnector />
        </div>
      </section>
      <ReviewAccuracy />
      <GoFurtherSection />
    </>
  );
}
