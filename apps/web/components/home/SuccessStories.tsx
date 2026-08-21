"use client";

import { ArrowRight } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import TestimonialCarousel from "@/components/home/TestimonialCarousel";
import { cn } from "@/lib/utils";

type SuccessStoriesProps = {
  className?: string;
};

export default function SuccessStories({ className }: SuccessStoriesProps) {
  return (
    <section
      className={cn("overflow-x-hidden px-5 pt-10 pb-15 lg:pt-30", className)}
    >
      <div className="mx-auto max-w-container">
        {/* Header row — left-aligned eyebrow + headline, right-aligned "view all" pill */}
        <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-between">
          <div className="flex flex-col items-center justify-center gap-6 lg:max-w-[546px] lg:items-start">
            <Paragraph
              className="border-b border-blue-100 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
              size="xs"
              color="primary"
            >
              ✦ success stories
            </Paragraph>
            <Heading as="h2" size="xl">
              4.8 million passed and counting
            </Heading>
          </div>

          <button
            type="button"
            aria-label="View all success stories"
            className="group inline-flex items-center gap-2 self-start rounded-full border border-white/50 bg-linear-to-r from-[#3b82f6] to-[#1e40af] px-5 py-4 text-base leading-6 font-semibold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] lg:self-auto"
          >
            <span className="whitespace-nowrap">View all success stories</span>
            <ArrowRight className="size-5 text-white transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <TestimonialCarousel />
      </div>
    </section>
  );
}
