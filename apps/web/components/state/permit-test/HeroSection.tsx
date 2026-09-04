"use client";

import Button from "@/components/ui/Button";
import HandUnderline from "@/components/ui/HandUnderline";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import ReviewerBadge from "@/components/state/ReviewerBadge";
import SignedOutOnly, { useIsSignedOut } from "@/components/state/SignedOutOnly";
import SignedInHero from "@/components/state/permit-test/SignedInHero";
import { useAuth } from "@/lib/auth-context";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { useStateStats } from "@/lib/useStateStats";
import { useNextQuizSlug } from "@/lib/usePhaseCompletion";
import { ArrowRight, BadgeCheck } from "lucide-react";
import LiveDataSection from "../LiveDataSection";

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

export default function HeroSection() {
  const { selectedState, selectedVehicle } = useWebLayout();
  const stats = useStateStats();
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
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
      <section className="py-15 lg:py-24 px-5">
        <div className="mx-auto max-w-container  flex flex-col xl:flex-row justify-between items-center xl:gap-4 md:gap-26 gap-18">
          <div className="space-y-8 xl:max-w-155">
            <Heading as="h1" className="mb-4.5">
              Start your Free{" "}
              <span className="relative inline-block whitespace-nowrap">
                {selectedState}
                <HandUnderline />
              </span>{" "}
              DMV Practice Test.
            </Heading>
            <Paragraph size="lg">
              Everything you need to pass the written test, from traffic signs
              to tricky road rules — all in one place.
            </Paragraph>
            <Button className="w-full md:w-fit" href={quizHref}>
              Start Free Practice Test <ArrowRight />
            </Button>
            <Paragraph className="flex gap-3 items-center flex-wrap font-semibold">
              <img src="/trustpilotstar.svg" alt="" /> Trustpilot 4.7/5 from
              38,000+ students
            </Paragraph>
          </div>
          <div className="max-w-151.5 relative rounded-[48px]">
            <img
              src="/statehub-banner.png"
              alt=""
              className="r w-full relative rounded-xl md:rounded-[24px] shadow-[0_12px_40.793px_-21.212px_rgba(23,37,84,0.12),0_3.263px_4.895px_-1.632px_rgba(0,0,0,0.03),0_9.79px_13.054px_-3.263px_rgba(0,0,0,0.08)]"
            />
            <div className="p-4 md:p-6 bg-white rounded-[24px] absolute -bottom-5 md:-bottom-7 left-2 md:-left-6 shadow-hover">
              <Heading className="text-blue-500!" size="sm">
                97%
              </Heading>
              <Paragraph className="" color="muted">
                pass rate
              </Paragraph>
            </div>
          </div>
        </div>
      </section>
      <SignedOutOnly>
      <section className="z-10 -mb-52.5 pt-15 md:space-y-15 lg:pt-30 px-5 bg-[linear-gradient(180deg,var(--background2)_0%,var(--background)_100%)]">
        <div className="mx-auto max-w-266 space-y-4 text-center">
          <Heading size="xl" className="font-semibold font-sora">
            Everything you need to pass the {selectedState} permit test in one
            place.
          </Heading>
          <Paragraph size="lg" className="mx-auto max-w-230">
            The {selectedState} DMV written test covers traffic laws,
            safe-driving practices, road signs, and alcohol awareness. Our
            questions mirror the official exam so there are no surprises on test
            day.
          </Paragraph>
        </div>
        <LiveDataSection />
      </section>
      </SignedOutOnly>
    </>
  );
}
