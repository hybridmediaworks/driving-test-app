"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { useWebLayout } from "@/lib/web-layout-context";
import { ArrowRight, BadgeCheck } from "lucide-react";

export default function HeroSection() {
  const { selectedState } = useWebLayout();

  return (
    <>
      <section className="py-15 md:space-y-15 lg:py-30 px-5">
        <div className="mx-auto max-w-container space-y-12  flex flex-col xl:flex-row justify-between items-center xl:gap-4 gap-8">
          <div className="space-y-4 xl:max-w-155">
            <Paragraph
              size="md"
              className="flex max-w-fit font-semibold items-center gap-2 rounded-full border bg-white px-3.75 py-2.25 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </div>
              <span className=" text-green-500">Live</span>
              <span>
                Active learners today: <strong>2,847</strong>
              </span>
            </Paragraph>
            <Heading as="h1">
              Start your Free{" "}
              <span className="text-blue-500">{selectedState}</span> DMV
              Practice Test.
            </Heading>
            <Paragraph size="lg">
              Real exam-style questions, pulled straight from the current West
              Virginia driver's handbook and updated for 2026. Stop wasting
              hours on the manual — practice the questions you'll actually see.
            </Paragraph>
            <Paragraph className="flex gap-3 items-center flex-wrap font-semibold">
              <img src="/trustpilotstar.svg" alt="" /> Trustpilot 4.7/5 from
              38,000+ students
            </Paragraph>
            <Button className="w-full md:w-fit">
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
          <div
            className="max-w-152 relative rounded-[48px] space-y-5 bg-blue-100 bg-cover bg-center ps-10 pb-10"
            style={{ backgroundImage: "url(/state-card-bg.png)" }}
          >
            <img
              src="/features-overview.svg"
              alt=""
              className="rotate-9 w-full relative rounded-xl md:rounded-[34px] -mt-7 shadow-[inset_0_1.451px_0_0_rgba(255,255,255,0.22),inset_0_0_0_1.451px_rgba(255,255,255,0.09),0_34.813px_72.527px_-31.912px_rgba(8,9,12,0.55),0_11.604px_29.011px_-17.407px_rgba(8,9,12,0.45)]"
            />
            <div>
              <Heading className="text-[96px]! leading-20!" color="primary">
                97%
              </Heading>
              <Heading size="xs" className="" color="secoundry">
                pass rate with Premium
              </Heading>
            </div>
          </div>
        </div>
      </section>
      <section className="py-15 md:space-y-15 lg:py-30 px-5 bg-[#F2F1EC]">
        <div className="mx-auto max-w-225 space-y-4 text-center">
          <Paragraph
            size="2xl"
            color="dark"
            className="font-semibold font-sora"
          >
            Everything you need to pass the West Virginia permit test — in one
            place.
          </Paragraph>
          <Paragraph size="lg">
            DriveLane turns the West Virginia driver's handbook into short,
            exam-style practice tests, an AI tutor that explains every wrong
            answer, full DMV exam simulations, and a personalized retest of the
            questions you miss. Practice free, or unlock Premium for the full
            West Virginia question bank and a documented 97% pass rate.
            DriveLane is an independent study platform and is not affiliated
            with the West Virginia Division of Motor Vehicles.
          </Paragraph>
        </div>
      </section>
    </>
  );
}
