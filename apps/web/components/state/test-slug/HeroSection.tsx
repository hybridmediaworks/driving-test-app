"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { stateAbbreviations, stateToSlug } from "@/lib/usStates";
import { ArrowRight, BadgeCheck, Clock, SignalHigh } from "lucide-react";

export default function HeroSection() {
  const { selectedState } = useWebLayout();
  const stateSlug = stateToSlug(selectedState);
  const stateCode = stateAbbreviations[selectedState] ?? "";

  return (
    <section className="py-15 lg:py-30 px-5">
      <div className="mx-auto max-w-container  flex flex-col xl:flex-row justify-between xl:gap-4 md:gap-26 gap-18">
        <div className="space-y-4 xl:max-w-165">
          <Paragraph
            size="md"
            className="flex max-w-fit font-semibold items-center gap-2 rounded-full border bg-white px-3.75 py-2.25 shadow-card"
          >
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className=" text-green-500">Live</span>
            <span>
              Students practicing right now: <strong>1,847</strong>
            </span>
          </Paragraph>
          <Heading as="h1">
            Free <span className="text-blue-500">{selectedState}</span> DMV
            Permit Practice Test 2026
          </Heading>
          <Paragraph size="lg">
            46 questions written from the current {selectedState} Driver
            Handbook. Answer, see why, and find out which topics would fail you
            — before the DMV does.
          </Paragraph>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="bg-white border rounded-xl px-6 py-4.5">
              <Heading size="sm">92%</Heading>
              <Paragraph size="sm">
                Avg. pass rate on our {selectedState} tests
              </Paragraph>
            </div>
            <div className="bg-white border rounded-xl px-6 py-4.5">
              <Heading size="sm">78%</Heading>
              <Paragraph size="sm">Average pass rate for this test</Paragraph>
            </div>
            <div className="bg-white border rounded-xl px-6 py-4.5">
              <Heading size="sm">4.8M+</Heading>
              <Paragraph size="sm">Drivers prepped on DriveLane</Paragraph>
            </div>
          </div>
          <Button
            className="w-full md:w-fit"
            href={`/${stateSlug}/dmv-written-test`}
          >
            Start Free Practice Test <ArrowRight />
          </Button>
          <div className="flex gap-4 flex-wrap">
            <Paragraph className="flex items-center gap-1" size="sm">
              <BadgeCheck className="w-5 h-5 text-green-700" /> 5-min quizzes
            </Paragraph>
            <Paragraph className="flex items-center gap-1" size="sm">
              <BadgeCheck className="w-5 h-5 text-green-700" /> No signup
              required
            </Paragraph>
            <Paragraph className="flex items-center gap-1" size="sm">
              <BadgeCheck className="w-5 h-5 text-green-700" /> Accuracy
              verified Jan 2026 by M. Reyes
            </Paragraph>
          </div>
        </div>
        <div className="mt-20 max-w-158 relative rounded-[32px] space-y-5 bg-blue-100 px-8 pb-10">
          <div className="w-full h-full absolute overflow-hidden left-0 rounded-[32px] z-0">
            <div className="bg-white blur-[125px] rounded-full aspect-square absolute -left-1/2 -bottom-1/2 w-full h-full z-0" />
          </div>

          <div className="-mt-20 relative z-10">
            <img
              src="/signature-license.png"
              alt=""
              className="w-full relative rounded-xl md:rounded-[34px] shadow-[inset_0_1.565px_0_0_rgba(255,255,255,0.22),inset_0_0_0_1.565px_rgba(255,255,255,0.09),0_37.571px_78.273px_-34.44px_rgba(8,9,12,0.55),0_12.524px_31.309px_-18.786px_rgba(8,9,12,0.45)]"
            />
            <div className="absolute w-full flex gap-2 items-center justify-center bottom-6">
              <div className="min-h-10.5 relative inline-flex px-2.5 py-2 items-center gap-1 bg-white text-sm leading-none whitespace-nowrap border rounded-full text-neutral-700">
                <SignalHigh className="text-yellow-500" />
                Moderate
              </div>
              <div className=" min-h-10.5 relative inline-flex px-2.5 py-2 items-center gap-1 bg-white text-sm leading-none whitespace-nowrap border rounded-full text-neutral-700">
                <Clock className="text-neutral-700 w-4 h-4" />
                30 min
              </div>
              <div className=" min-h-10.5 relative inline-flex px-2.5 py-2 items-center gap-1 bg-white text-sm leading-none whitespace-nowrap border rounded-full text-neutral-700">
                46 questions{" "}
                <span className="hidden lg:inline">· 38 to pass</span>
              </div>
            </div>
          </div>
          <div className="relative space-y-5 z-10">
            <Paragraph className="pt-4 flex gap-3 items-center justify-center flex-wrap font-semibold">
              <img src="/trustpilotstar.svg" alt="" /> Trustpilot 4.7/5 from
              38,000+ students
            </Paragraph>
            <div className="space-y-4 text-center py-4">
              <Paragraph>Tricky exam topics covered here:</Paragraph>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Right-of-way at 4-way stops",
                  "Blood alcohol limits by age",
                  "Parking on a grade",
                  "Flashing red vs. flashing yellow",
                ].map((t) => (
                  <Paragraph
                    size="sm"
                    key={t}
                    className="rounded-full bg-neutral-50 px-3.5 border py-1.75 whitespace-nowrap"
                  >
                    {t}
                  </Paragraph>
                ))}
              </div>
            </div>

            <Paragraph
              size="sm"
              className="flex font-semibold items-center gap-2 justify-center"
            >
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-200" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <span className=" text-blue-500">Live</span>
              <span>
                <strong> 9,617 </strong>tests completed today statewide
              </span>
            </Paragraph>
          </div>
        </div>
      </div>
    </section>
  );
}
