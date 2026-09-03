"use client";

import HeroSection from "@/components/state/permit-test/HeroSection";
import ExamSimulatorSection from "@/components/state/ExamSimulatorSection";
import ExpertsSection from "@/components/state/ExpertsSection";
import ExtraSupportSection from "@/components/state/ExtraSupportSection";
import GoFurtherSection from "@/components/state/GoFurtherSection";
import HandbookSection from "@/components/state/HandbookSection";
import PhaseLadderSection from "@/components/state/PhaseLadderSection";
import PremiumSpeedSection from "@/components/state/PremiumSpeedSection";
import QuizVaultSection from "@/components/state/QuizVaultSection";
import LearnSection from "@/components/home/LearnSection";

/**
 * Section order follows the State Hub frame in Figma (file i86zaHUyFDEleJ5LTVnOdh, node
 * 4147:7888), top to bottom: hero → "everything you need" + live stats (both inside HeroSection)
 * → phase ladder → premium speed banner → exam simulator → extra support → quiz vault → learn
 * your way → handbook → reviewers → helpful resources. The closing CTA and footer are added by
 * the page shell.
 */
export default function PermitTestContent() {
  return (
    <>
      <HeroSection />
      <div className="relative pt-52.5 bg-background2">
        <PhaseLadderSection />
      </div>
      <PremiumSpeedSection />
      <ExamSimulatorSection />
      <ExtraSupportSection />
      <QuizVaultSection />
      <LearnSection />
      <HandbookSection />
      <ExpertsSection />
      <GoFurtherSection />
    </>
  );
}
