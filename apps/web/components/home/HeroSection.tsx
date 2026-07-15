"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import StateSelectModal from "@/components/home/StateSelectModal";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function HeroSection() {
  const { selectedState, hasStoredState } = useWebLayout();
  const [showStateModal, setShowStateModal] = useState(false);

  const stateHref = hasStoredState ? `/${stateToSlug(selectedState)}` : undefined;

  function onStartClick() {
    if (!hasStoredState) {
      setShowStateModal(true);
    }
  }

  return (
    <section className="relative px-5 pt-10 lg:pt-15 lg:pb-11">
      <div className="absolute top-7.75 right-1 z-0 h-169 w-228.5 bg-radial-brand" />
      <div className="relative z-10 mx-auto flex max-w-container flex-col justify-between gap-8 lg:flex-row lg:gap-2">
        <div className="space-y-8 pt-0 lg:max-w-183.25 lg:pt-15">
          <div className="space-y-4">
            <Heading as="h1">
              Ace your <span className="text-blue-500">{selectedState}</span> DMV Driving Test.
            </Heading>
            <Paragraph size="xl">
              Stop wasting hours on the manual. DriveLane adapts to how you learn — with smart practice
              tests, AI explanations, and a guaranteed path to your license.
            </Paragraph>
          </div>

          <Button href={stateHref} onClick={onStartClick}>
            {hasStoredState ? `Start Free ${selectedState} Practice Test` : "Try it for free"}
            <ArrowRight />
          </Button>

          <StateSelectModal open={showStateModal} onClose={() => setShowStateModal(false)} />
        </div>
        <div className="w-full lg:w-auto">
          <Image
            src="/banner-image.png"
            alt=""
            width={600}
            height={600}
            className="mx-auto w-full max-w-lg lg:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
