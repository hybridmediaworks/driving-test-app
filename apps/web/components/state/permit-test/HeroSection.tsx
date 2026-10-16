"use client";

import { vehicleHeroImage } from "@/lib/vehicleImages";
import Button from "@/components/ui/Button";
import HandUnderline from "@/components/ui/HandUnderline";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import ReviewerBadge from "@/components/state/ReviewerBadge";
import SignedOutOnly, { useIsSignedOut } from "@/components/state/SignedOutOnly";
import SignedInHero from "@/components/state/permit-test/SignedInHero";
import HeroQuizCard from "@/components/state/permit-test/HeroQuizCard";
import { useAuth } from "@/lib/auth-context";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { useStateStats } from "@/lib/useStateStats";
import { useNextQuizSlug } from "@/lib/usePhaseCompletion";
import { ArrowRight, BadgeCheck } from "lucide-react";
import EverythingYouNeedSection from "@/components/state/permit-test/EverythingYouNeedSection";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

export default function HeroSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stats = useStateStats();
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const isCdl = selectedVehicle === "CDL";
  const isMotorcycle = selectedVehicle === "Motorcycle";
  const heroImage = vehicleHeroImage(selectedVehicle);
  const stateAbbr = selectedState ? stateAbbreviations[selectedState] : undefined;
  const nextQuizSlug = useNextQuizSlug("permit_test");
  // Jump straight to the test the learner should take now (first one if nothing's been taken yet,
  // otherwise wherever their progression left off) instead of a generic free+premium browse list.
  // Falls back to the old browse-all href until that's resolved (near-instant — it shares its
  // request with the phase-ladder section further down this same page) or if it comes back empty.
  const quizzesHref = selectedState
    ? `/quizzes?state=${stateAbbreviations[selectedState]}&vehicle_type=${vehicleType}&test_track=permit_test`
    : `/quizzes?vehicle_type=${vehicleType}&test_track=permit_test`;
  const quizHref =
    selectedState && nextQuizSlug
      ? `/${stateToSlug(selectedState)}/${nextQuizSlug}`
      : quizzesHref;

  // A learner who's signed in doesn't need the pitch — they get the "here's where you are" hero
  // instead. Rendered nothing-at-all while auth resolves so the marketing hero never flashes.
  const signedOut = useIsSignedOut();
  const { loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!signedOut) {
    return <SignedInHero />;
  }

  return (
    <>
      <section className="pt-15 pb-20 lg:py-20 px-5">
        <div className="mx-auto max-w-container flex flex-col xl:flex-row justify-between items-center gap-16 xl:gap-12">
          <div className="w-full xl:max-w-155">
            {stateAbbr && (
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white dark:bg-neutral-800 py-1 pl-1 pr-3.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 shadow-xs">
                <span className="inline-flex h-6 min-w-8 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                  {stateAbbr}
                </span>
                {selectedState} {isCdl ? "CDL knowledge test" : isMotorcycle ? "DMV motorcycle test" : "DMV written test"}
              </span>
            )}
            <Heading as="h1" weight="bold">
              Start your free{" "}
              <span className="relative inline-block whitespace-nowrap text-blue-600 dark:text-blue-400">
                {selectedState}
                <HandUnderline />
              </span>{" "}
              {isCdl
                ? "CDL practice tests - all endorsements"
                : isMotorcycle
                  ? "motorcycle practice tests 2026"
                  : "DMV practice test"}
            </Heading>
            <Paragraph size="lg" className="mt-6 max-w-120">
              {isCdl
                ? "Practice the exact question formats your DMV uses. When you sit down for the real test, you'll know the answer before you finish reading the question. Pass, get your CDL, and start earning $60K+ within weeks - not months."
                : isMotorcycle
                  ? `Practice with real exam-like questions that mirror your ${selectedState} DMV permit test - same format, same difficulty, same tricky answer choices.`
                  : "Everything you need to pass the written test, from traffic signs to tricky road rules, in one guided route."}
            </Paragraph>
            <div className="mt-8 flex flex-col md:flex-row gap-3">
              <Button className="w-full md:w-fit rounded-xl!" href={quizHref}>
                Start free practice test <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="w-full md:w-fit rounded-xl! bg-white! dark:bg-neutral-800! hover:bg-neutral-50! dark:hover:bg-neutral-700! shadow-xs"
                href="#study-route"
              >
                See the study route
              </Button>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <img src="/trustpilot-stars-boxed.svg" alt="" className="h-5 w-auto" />
              <span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">Trustpilot 4.7/5</span> from
                38,000+ students
              </span>
            </p>
          </div>
          <div className="relative w-full max-w-151.5 shrink-0">
            <img
              src={heroImage.src}
              alt={heroImage.alt}
              className="aspect-[3/2] w-full rounded-xl md:rounded-[24px] object-cover object-top shadow-[0_12px_40.793px_-21.212px_rgba(23,37,84,0.12),0_3.263px_4.895px_-1.632px_rgba(0,0,0,0.03),0_9.79px_13.054px_-3.263px_rgba(0,0,0,0.08)]"
            />
            <div className="absolute top-4 -right-2 md:top-5 md:-right-3 rounded-2xl bg-white dark:bg-neutral-800 px-4 py-3 shadow-hover">
              <p className="font-sora text-2xl md:text-[28px] font-bold leading-none text-blue-600 dark:text-blue-400">
                97%
              </p>
              <p className="mt-1.5 text-xs md:text-sm text-neutral-500 dark:text-neutral-400">pass rate</p>
            </div>
            {!isCdl && !isMotorcycle && <HeroQuizCard href={quizHref} />}
          </div>
        </div>
      </section>
      <SignedOutOnly>
        <EverythingYouNeedSection />
      </SignedOutOnly>
    </>
  );
}
