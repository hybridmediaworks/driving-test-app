"use client";

import GoFurtherSection from "@/components/state/GoFurtherSection";
import HandbookCard from "@/components/state/HandbookCard";
import LiveDataSection from "@/components/state/LiveDataSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";
import HeroSection from "./permit-test/HeroSection";

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
