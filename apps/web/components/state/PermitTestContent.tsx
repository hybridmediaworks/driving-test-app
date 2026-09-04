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
import SignedOutOnly, { useIsSignedOut } from "@/components/state/SignedOutOnly";
import LearnSection from "@/components/home/LearnSection";

/**
 * Section order follows the State Hub frame in Figma (file i86zaHUyFDEleJ5LTVnOdh, node
 * 4147:7888), top to bottom: hero → "everything you need" + live stats (both inside HeroSection)
 * → phase ladder → premium speed banner → exam simulator → extra support → quiz vault → learn
 * your way → handbook → reviewers → helpful resources. The closing CTA and footer are added by
 * the page shell.
 */
export default function PermitTestContent() {
  // The live-stats card sits half-outside its own section (-mb-52.5) and overlaps into the ladder,
  // which reserves the matching space with pt-52.5. Hide that section and the reservation becomes
  // 210px of empty page, so it goes with it.
  const signedOut = useIsSignedOut();

  return (
    <>
      <HeroSection />
      <div className={`relative bg-background2 ${signedOut ? "pt-52.5" : ""}`}>
        <PhaseLadderSection />
      </div>
      <PremiumSpeedSection />
      <ExamSimulatorSection />
      <ExtraSupportSection />
      <QuizVaultSection />
      <SignedOutOnly>
        <LearnSection />
      </SignedOutOnly>
      <HandbookSection />
      <SignedOutOnly>
        <ExpertsSection />
      </SignedOutOnly>
      <GoFurtherSection />
    </>
  );
}
