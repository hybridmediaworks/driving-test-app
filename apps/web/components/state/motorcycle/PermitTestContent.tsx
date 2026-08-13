"use client";

import GoFurtherSection from "@/components/state/GoFurtherSection";
import LiveDataSection from "@/components/state/LiveDataSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";
import HeroSection from "./permit-test/HeroSection";

export default function PermitTestContent() {
  return (
    <>
      <HeroSection />
      <LiveDataSection />
      {/* Handbook + "end of theory" milestone now render as the final rung inside the ladder. */}
      <PhaseLadderSection />
      <GoFurtherSection />
    </>
  );
}
