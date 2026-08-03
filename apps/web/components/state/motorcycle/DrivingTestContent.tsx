"use client";

import { useEffect, useState } from "react";
import {
  fetchMotorcycleDrivingTestSections,
  type DrivingTestSection as DrivingTestSectionData,
} from "@/data/motorcycleDrivingTestMockData";
import CardsSection from "./driving-test/CardsSection";
import HeroSection from "./driving-test/HeroSection";
import GoFurtherSection from "./permit-test/GoFurtherSection";

export default function DrivingTestContent() {
  const [sections, setSections] = useState<DrivingTestSectionData[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchMotorcycleDrivingTestSections().then((data) => {
      if (!cancelled) setSections(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <HeroSection />
      <section className="px-5 pt-15 pb-15 lg:pt-30 lg:pb-30 bg-background2 mb-15 lg:mb-30">
        <div className="mx-auto max-w-container space-y-15">
          {sections.map((section) => (
            <CardsSection key={section.id} section={section} />
          ))}
        </div>
      </section>
      <GoFurtherSection />
    </>
  );
}
