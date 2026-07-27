"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { ArrowRight, BadgeCheck, Gem } from "lucide-react";

export default function PremiumCTA() {
  const { selectedState } = useWebLayout();

  return (
    <section className="py-15 md:space-y-15 lg:py-30 px-5">
      <div
        className="mx-auto max-w-container xl:ps-24 bg-cover bg-blue-950 border border-blue-200 rounded-xl  flex flex-col xl:flex-row justify-between items-center xl:gap-4 gap-6"
        style={{ backgroundImage: "url('/state-premium-cta.png')" }}
      >
        <div className="space-y-4 xl:max-w-161 xl:py-14 py-5 px-5 xl:px-0 h-full">
          <Heading as="h2" color="white">
            {selectedState} students who use Premium pass
            <span className="text-blue-500"> 97% of the time</span>
          </Heading>
          <Paragraph className="mb-6 text-neutral-300!">
            Right-of-way, signals, speed limits, lane rules — the core of the{" "}
            {selectedState} written exam. Master these first.
          </Paragraph>
          <Button
            className="w-full md:w-fit bg-yellow-500! border-yellow-500!"
            variant="outline"
          >
            <Gem /> Upgrade to Premium
          </Button>
        </div>
        <div>
          <img
            src="/state-premium-girl.png"
            alt=""
            className="lg:-mt-25 -mt-12"
          />
        </div>
      </div>
    </section>
  );
}
