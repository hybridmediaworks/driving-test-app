import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="py-15 md:space-y-15 lg:py-30 px-5">
      <div className="mx-auto max-w-container space-y-12  flex flex-col xl:flex-row justify-between items-center xl:gap-4 gap-8">
        <div className="space-y-4 xl:max-w-139.5">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase max-w-fit"
            size="xs"
            color="primary"
          >
            ✦ Features
          </Paragraph>
          <Heading as="h1" className="max-w-97.75">
            Seven tools. One license.
          </Heading>
          <Paragraph size="xl" className="pt-2">
            Everything DriveLane does points at a single outcome: you pass the
            DMV test the first time. Pick the tool you need today — they all
            feed the same study plan underneath.
          </Paragraph>
          <div className="flex gap-6 pt-4 flex-wrap">
            <Button className="w-full md:w-fit">
              Start Free Practice Test <ArrowRight />
            </Button>
            <Button variant="outline" className="w-full md:w-fit">
              See the Three Steps
            </Button>
          </div>
        </div>
        <div className="max-w-152 relative flex items-center justify-center me-20 ms-10">
          <div className="zoom-70 md:zoom-100 -rotate-4 absolute z-1 -top-10 bg-white p-4 max-w-41.75 rounded-[20px] shadow-[0_16px_32px_-31.912px_rgba(8,9,12,0.12),0_6px_15px_-17.407px_rgba(8,9,12,0.10)]">
            <Paragraph size="lg" color="dark" className="font-bold">
              One plan
            </Paragraph>
            <Paragraph>every feature, no add-on pricing.</Paragraph>
          </div>
          <img
            src="/features-overview.svg"
            className="rotate-6 w-full relative rounded-xl md:rounded-[34px] shadow-[inset_0_1.451px_0_0_rgba(255,255,255,0.22),inset_0_0_0_1.451px_rgba(255,255,255,0.09),0_34.813px_72.527px_-31.912px_rgba(8,9,12,0.55),0_11.604px_29.011px_-17.407px_rgba(8,9,12,0.45)]"
          />
          <div className="zoom-70 md:zoom-100 -rotate-4 absolute z-1 -bottom-10 -left-14 bg-white p-4 max-w-70 rounded-[20px] shadow-[0_16px_32px_-31.912px_rgba(8,9,12,0.12),0_6px_15px_-17.407px_rgba(8,9,12,0.10)]">
            <Paragraph size="lg" color="dark" className="font-bold">
              Car, CDL and motorcycle
            </Paragraph>
            <Paragraph>the same seven tools, retuned per test.</Paragraph>
          </div>
          <div className="zoom-70 md:zoom-100 -rotate-4 absolute z-1  -right-30 bg-white p-4 max-w-56.5 rounded-[20px] shadow-[0_16px_32px_-31.912px_rgba(8,9,12,0.12),0_6px_15px_-17.407px_rgba(8,9,12,0.10)]">
            <Paragraph size="lg" color="dark" className="font-bold">
              47 states
            </Paragraph>
            <Paragraph>
              questions written to your DMV's current handbook.
            </Paragraph>
          </div>
        </div>
      </div>
    </section>
  );
}
