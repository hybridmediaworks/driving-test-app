"use client";

import HeroSection from "@/components/state/permit-test/HeroSection";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import LiveDataSection from "@/components/state/LiveDataSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";

export default function PermitTestContent() {
  return (
    <>
      <HeroSection />
      {/* Handbook + "end of theory" milestone now render as the final rung inside the ladder. */}
      <div className="relative pt-52.5 bg-background2">
        <PhaseLadderSection />
      </div>
      <GoFurtherSection />
    </>
  );
}
