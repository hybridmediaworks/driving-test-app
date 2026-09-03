"use client";

import GoFurtherSection from "@/components/state/GoFurtherSection";
import HandbookSection from "@/components/state/HandbookSection";
import LiveDataSection from "@/components/state/LiveDataSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";
import HeroSection from "./permit-test/HeroSection";

export default function PermitTestContent() {
  return (
    <>
      <HeroSection />
      <LiveDataSection />
      <PhaseLadderSection />
      <HandbookSection />
      <GoFurtherSection />
    </>
  );
}
