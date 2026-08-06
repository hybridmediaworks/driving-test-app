"use client";

import GoFurtherSection from "@/components/state/GoFurtherSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";
import HeroSection from "./driving-test/HeroSection";

export default function DrivingTestContent() {
  return (
    <>
      <HeroSection />
      <PhaseLadderSection />
      <GoFurtherSection />
    </>
  );
}
