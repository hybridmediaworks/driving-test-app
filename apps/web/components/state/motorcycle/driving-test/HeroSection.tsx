"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateAbbreviations } from "@/lib/usStates";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  const { selectedState } = useWebLayout();
  const quizzesHref = selectedState
    ? `/quizzes?state=${stateAbbreviations[selectedState]}&vehicle_type=motorcycle`
    : "/quizzes?vehicle_type=motorcycle";

  return (
    <section className="py-15 lg:py-30 px-5">
      <div className="mx-auto max-w-container  flex flex-col xl:flex-row justify-between items-center xl:gap-4 md:gap-26 gap-18">
        <div className="space-y-6 w-full xl:max-w-155">
          <Heading as="h1">From permit to pavement</Heading>
          <Paragraph size="lg">
            Practice with our simulators to bridge the gap before your road
            test.
          </Paragraph>
          <Button
            className="w-full md:w-fit"
            href={quizzesHref}
          >
            Start Motorcycle Permit Practice Test <ArrowRight />
          </Button>
        </div>
        <div className="max-w-152 w-full relative rounded-xl space-y-5 bg-blue-100 bg-cover bg-center ps-10 pb-10">
          <div className="aspect-video w-full flex items-center -mt-7 justify-center rounded-xl shadow-[0_4px_6px_-2px_rgba(0,0,0,0.03),0_12px_16px_-4px_rgba(0,0,0,0.08)] bg-[linear-gradient(157deg,#1E3A8A_0%,var(--color-blue-1000)_100%)]">
            <Play className="text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}
