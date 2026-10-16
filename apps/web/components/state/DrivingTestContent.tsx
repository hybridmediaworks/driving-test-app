"use client";

import DrivingVideosSection from "@/components/state/DrivingVideosSection";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import HandbookSection from "@/components/state/HandbookSection";
import StudyRouteSection from "@/components/state/permit-test/StudyRouteSection";
import HeroSection from "./driving-test/HeroSection";

export default function DrivingTestContent() {
  return (
    <>
      <HeroSection />
      <StudyRouteSection track="driving" />
      <DrivingVideosSection />
      <HandbookSection />
      <GoFurtherSection />
    </>
  );
}
