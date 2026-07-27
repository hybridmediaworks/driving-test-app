"use client";

import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { Check } from "lucide-react";
import Subheading from "@/components/ui/Subheading";

export default function ReviewAccuracy() {
  const { selectedState } = useWebLayout();

  return (
    <section className="py-15 md:space-y-15 lg:py-30 px-5">
      <div className="mx-auto max-w-container flex flex-col xl:flex-row justify-between items-center xl:gap-4 gap-6">
        <div className="xl:max-w-138.75 space-y-4">
          <Subheading text="Reviewed for accuracy" />
          <Heading as="h2">Checked by people who know the test</Heading>
          <Paragraph size="xl" color="muted">
            Every {selectedState} question is reviewed against the current
            handbook by credentialed experts.
          </Paragraph>
        </div>
        <div className="flex-1 grid md:grid-cols-2 grid-cols-1 gap-4">
          <div className="p-6 bg-[#FAFAFA] border rounded-lg space-y-4.5">
            <div className="flex gap-4 items-center">
              <div className="w-16.5 h-16.5 rounded-full border bg-[#F5F5F5] text-xs flex items-center justify-center text-center text-neutral-400">
                [IMAGE] headshot
              </div>

              <div className="flex-1">
                <Paragraph size="2xl" className="font-semibold" color="dark">
                  Marcus Reyes
                </Paragraph>
                <Paragraph color="muted" size="sm">
                  Licensed Driving Instructor · 23 yrs
                </Paragraph>
                <Paragraph
                  color="dark"
                  size="sm"
                  className="flex gap-1 text-green-700! font-semibold mt-3"
                >
                  <Check className="w-3.5" /> Verified for accuracy Jan 2026
                </Paragraph>
              </div>
            </div>
            <Paragraph>
              "These questions mirror what students actually face at the{" "}
              {selectedState} DMV. The explanations are where DriveLane really
              earns its keep."{" "}
            </Paragraph>
          </div>
          <div className="p-6 bg-[#FAFAFA] border rounded-lg space-y-4.5">
            <div className="flex gap-4 items-center">
              <div className="w-16.5 h-16.5 rounded-full border bg-[#F5F5F5] text-xs flex items-center justify-center text-center text-neutral-400">
                [IMAGE] headshot
              </div>

              <div className="flex-1">
                <Paragraph size="2xl" className="font-semibold" color="dark">
                  Dana Whitfield
                </Paragraph>
                <Paragraph color="muted" size="sm">
                  Former DMV Examiner · 11 yrs
                </Paragraph>
                <Paragraph
                  color="dark"
                  size="sm"
                  className="flex gap-1 text-green-700! font-semibold mt-3"
                >
                  <Check className="w-3.5" /> Verified for accuracy Jan 2026
                </Paragraph>
              </div>
            </div>
            <Paragraph>
              "I graded thousands of real exams. DriveLane's simulator sets the
              same bar — students who pass here are ready."
            </Paragraph>
          </div>
        </div>
      </div>
    </section>
  );
}
