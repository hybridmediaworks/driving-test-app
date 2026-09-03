"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import ReviewerBadge from "@/components/state/ReviewerBadge";
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

  return (
    <>
      <section className="py-15 lg:py-24 px-5">
        <div className="mx-auto max-w-container  flex flex-col xl:flex-row justify-between items-center xl:gap-4 md:gap-26 gap-18">
          <div className="space-y-8 xl:max-w-155">
            <Heading as="h1" className="mb-4.5">
              Start your Free{" "}
              <span className="relative inline-block whitespace-nowrap">
                {selectedState}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 429 16"
                  preserveAspectRatio="none"
                  fill="none"
                  className="pointer-events-none absolute bottom-[-0.06em] left-0 h-[0.22em] w-full"
                >
                  <path
                    d="M397.324 9.57165C382.141 9.57165 366.958 9.68155 351.775 9.54168C339.6 9.43178 327.425 8.84232 315.233 8.77238C304.695 8.71244 294.087 8.73241 283.621 9.35185C261.638 10.6407 239.762 12.549 217.762 13.7579C207.171 14.3374 196.812 13.3682 186.488 11.0703C169.65 7.32368 152.188 9.13203 135.047 11.0903C125.044 12.2292 115.13 13.598 105.126 14.6671C96.2442 15.6162 88.3411 14.727 81.1323 11.1402C73.87 7.5235 64.5074 8.42268 56.106 9.53168C43.8955 11.1302 31.952 13.3782 19.9373 15.4364C12.408 16.7252 5.60858 15.876 1.01628 12.1393C-0.496688 10.9104 -0.12289 8.5126 0.856089 6.94401C1.26548 6.28461 6.14254 5.71511 7.8869 6.24463C13.4582 7.93311 18.3353 6.78417 23.515 5.92494C38.7514 3.39722 54.0235 0.689665 70.1678 1.45897C75.4009 1.70875 81.3459 2.38814 85.4042 4.05663C93.6454 7.45357 102.118 6.81412 110.929 5.96489C126.112 4.49621 141.224 2.7678 156.46 1.52892C167.799 0.609745 178.941 1.39902 189.835 3.76689C203.487 6.72422 217.816 5.96491 231.895 5.05573C255.426 3.5371 278.833 1.20919 302.417 0.140154C315.446 -0.449315 328.725 0.999367 341.914 1.1892C359.536 1.43897 377.175 1.2991 394.815 1.43897C403.91 1.50891 413.059 1.61882 422.084 2.19829C424.611 2.35815 428.296 4.05662 428.83 5.38542C429.916 8.06301 425.59 8.25285 421.995 8.36275C413.789 8.6325 405.584 8.92222 397.378 9.21196C397.378 9.33185 397.36 9.45175 397.342 9.56165L397.324 9.57165Z"
                    fill="#22C55E"
                  />
                </svg>
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
    </>
  );
}
