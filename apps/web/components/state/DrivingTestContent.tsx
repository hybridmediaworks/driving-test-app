"use client";

import DrivingVideosSection from "@/components/state/DrivingVideosSection";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import LiveDataSection from "@/components/state/LiveDataSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";
import HeroSection from "./driving-test/HeroSection";

export default function DrivingTestContent() {
  return (
    <>
      <HeroSection />
      <LiveDataSection />
      <PhaseLadderSection />
      <DrivingVideosSection />
      <GoFurtherSection />
    </>
  );
}
