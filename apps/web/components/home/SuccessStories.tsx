"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import TestimonialCarousel from "@/components/home/TestimonialCarousel";
import StateSelectModal from "@/components/home/StateSelectModal";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";
import { cn } from "@/lib/utils";

type SuccessStoriesProps = {
  className?: string;
};

export default function SuccessStories({ className }: SuccessStoriesProps) {
  const { selectedState, hasStoredState } = useWebLayout();
  const [showStateModal, setShowStateModal] = useState(false);

  const stateHref = hasStoredState ? `/${stateToSlug(selectedState)}` : undefined;

  function onStartClick() {
    if (!hasStoredState) {
      setShowStateModal(true);
    }
  }

  return (
    <section
      className={cn("overflow-x-hidden px-5 pt-10 pb-15 lg:pt-30", className)}
    >
      <div className="mx-auto max-w-container space-y-12">
        <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-between">
          <div className="flex flex-col items-center justify-center gap-6 lg:max-w-170 lg:items-start">
            <Paragraph
              className="border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
              size="xs"
              color="primary"
            >
              ✦ success stories
            </Paragraph>
            <Heading as="h2" size="lg" className="font-bold!">
              4.8 million passed and counting
            </Heading>
          </div>
          <Button
            className="self-start lg:self-auto"
            href={stateHref}
            onClick={onStartClick}
          >
            {hasStoredState ? `Start Free ${selectedState} Practice Test` : "Try it for free"}{" "}
            <ArrowRight />
          </Button>
        </div>
        <TestimonialCarousel />

        <StateSelectModal open={showStateModal} onClose={() => setShowStateModal(false)} />
      </div>
    </section>
  );
}
