"use client";

import HeroSection from "@/components/state/permit-test/HeroSection";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import HandbookCard from "@/components/state/HandbookCard";
import LiveDataSection from "@/components/state/LiveDataSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";

export default function PermitTestContent() {
  return (
    <>
      <HeroSection />
      <LiveDataSection />
      <PhaseLadderSection />
      <HandbookCard />
      <GoFurtherSection />
    </>
  );
}
