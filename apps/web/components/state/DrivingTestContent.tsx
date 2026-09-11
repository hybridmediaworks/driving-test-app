"use client";

import DrivingVideosSection from "@/components/state/DrivingVideosSection";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import HandbookSection from "@/components/state/HandbookSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";
import HeroSection from "./driving-test/HeroSection";

export default function DrivingTestContent() {
  return (
    <>
      <HeroSection />
      <PhaseLadderSection />
      <DrivingVideosSection />
      <HandbookSection />
      <GoFurtherSection />
    </>
  );
}
