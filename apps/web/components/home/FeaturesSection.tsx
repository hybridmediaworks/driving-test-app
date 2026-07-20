import { ArrowRight, Ellipsis } from "lucide-react";
import Image from "next/image";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Button from "../ui/Button";

export default function FeaturesSection() {
  return (
    <section
      className="bg-auto bg-top-right bg-no-repeat px-5 pt-10 pb-15 lg:px-20 lg:pt-30"
      style={{ backgroundImage: "url('/features-bg.webp')" }}
    >
      <div className="mx-auto max-w-container space-y-12">
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div className="max-w-170 space-y-4">
            <Paragraph
              className="border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
              size="xs"
              color="primary"
            >
              ✦ Features
            </Paragraph>
            <Heading as="h2">
              Every tool built for the moment it matters.
            </Heading>
            <Paragraph className="max-w-161" size="xl">
              One platform, from your first practice question to the seat of the
              examiner&rsquo;s car.
            </Paragraph>
          </div>
          <Button href="/features-overview">
            Explore All Features <ArrowRight />
          </Button>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="group">
              <div className="flex h-1/2 min-h-fit flex-col justify-between gap-5.5 rounded-xl bg-[#0D142C] p-6 transition-[height] duration-500 group-hover:h-full hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
                <div className="space-y-1.5">
                  <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#2B59FF] text-[#9CB4FF]">
                    ✦
                  </div>
                  <Heading as="h3" size="xs" className="pt-2" color="white">
                    AI Driving Tutor
                  </Heading>
                  <Paragraph className="text-white/62">
                    Ask anything. Get explained answers, weak-spot drills, and a
                    study plan that adapts after every question.
                  </Paragraph>
                </div>
                <div className="rounded-[14px] bg-blue-950 p-3.75">
                  <div className="max-w-120 space-y-2">
                    <Paragraph
                      className="ms-auto mr-0 w-[85%] rounded-xl rounded-br-lg bg-blue-700 px-3 py-2 text-[13px]"
                      color="white"
                    >
                      Why is it 3 seconds, not 2?
                    </Paragraph>
                    <Paragraph className="ms-0 mr-auto w-[85%] rounded-xl rounded-bl-lg bg-blue-900 px-3 py-2 text-[13px] text-[#E8E8EC]!">
                      The 3-second rule gives safe stopping distance at speed.
                      At 60 mph you cover ~88 ft/sec — 2 seconds leaves too
                      little margin in the rain.
                    </Paragraph>
                    <Paragraph
                      className="ms-0 mr-auto max-w-fit rounded-xl rounded-bl-lg bg-blue-900 px-3 text-[13px]"
                      color="white"
                    >
                      <Ellipsis className="text-blue-300" />
                    </Paragraph>
                  </div>
                </div>
              </div>
            </div>
            <div className="group space-y-1.5 rounded-xl border border-[#E7E6E1] bg-white p-6 hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)]">
              <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B59FF]">
                ▣
              </div>
              <Heading as="h3" size="2xs" className="pt-2">
                Mock Exams
              </Heading>
              <Paragraph>
                Real DMV format, real timing, instant scoring.
              </Paragraph>
              <div className="flex h-auto justify-end overflow-hidden rounded-xl border border-[#E7E6E1] bg-blue-200 pt-2.25 lg:h-96">
                <Image
                  src="/mock-exam.png"
                  alt=""
                  width={500}
                  height={400}
                  className="mx-auto w-4/5 transition-[width] duration-500 group-hover:w-full"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-1.5 rounded-xl border border-[#E7E6E1] bg-white p-6 hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)] md:min-h-65">
              <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B59FF]">
                ◴
              </div>
              <Heading as="h3" size="2xs" className="pt-2">
                Progress Tracking
              </Heading>
              <Paragraph className="max-w-51.5">
                Know exactly when you&rsquo;re ready.
              </Paragraph>
            </div>
            <div className="space-y-1.5 rounded-xl border border-[#E7E6E1] bg-white p-6 hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)] md:min-h-65">
              <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B59FF]">
                ◗
              </div>
              <Heading as="h3" size="2xs" className="pt-2">
                Voice Learning
              </Heading>
              <Paragraph>Study hands-free, on the move.</Paragraph>
            </div>
            <div className="space-y-1.5 rounded-xl border border-[#E7E6E1] bg-white p-6 hover:shadow-[0_24px_50px_-26px_rgba(11,11,13,0.35)] md:min-h-65">
              <div className="h9.5 flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B59FF]">
                ⬡
              </div>
              <Heading as="h3" size="2xs" className="pt-2">
                Flashcards
              </Heading>
              <Paragraph>Spaced repetition that sticks.</Paragraph>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
