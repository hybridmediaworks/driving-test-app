import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="py-15 md:space-y-15 lg:py-30">
      <div className="mx-auto max-w-container space-y-12 px-5 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="space-y-4 lg:max-w-168.75">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
            size="xs"
            color="primary"
          >
            ✦ How it works
          </Paragraph>
          <Heading as="h1">
            Three steps between you and the card in your wallet.
          </Heading>
          <Paragraph size="xl" className="pt-2">
            No manual marathons, no guessing what the test will ask. Tell us
            where you're testing, practice on the real question bank until the
            answers are automatic, then walk in calm — with a readiness score
            that tells you the day you're ready.
          </Paragraph>
          <div className="flex gap-6 pt-4 flex-wrap">
            <Button className="w-full md:w-fit">
              Start Free Practice Test <ArrowRight />
            </Button>
            <Button variant="outline" className="w-full md:w-fit">
              See the Three Steps
            </Button>
          </div>
          <Paragraph size="sm">
            Free to start · No credit card · Average time to test-ready: 9 days.
          </Paragraph>
        </div>
        <div className="bg-white w-full space-y-6 max-w-130 p-5 lg:p-8 rounded-xl shadow-[0_12px_35px_-26px_rgba(20,60,120,0.25),0_4px_6px_-2px_rgba(20,60,120,0.03)]">
          <Paragraph size="2xl" color="dark" className="font-semibold">
            The whole path, in one glance
          </Paragraph>
          <div className="space-y-3.5">
            <div className="flex gap-3 items-center">
              <Paragraph
                className="bg-blue-500 rounded-full min-w-6 h-6 text-center font-bold leading-6! flex items-center justify-center"
                size="xs"
                color="white"
              >
                1
              </Paragraph>
              <Paragraph>
                <strong>Set up</strong> — pick your state and test type. 2
                minutes.
              </Paragraph>
            </div>
            <div className="flex gap-3 items-center">
              <Paragraph
                className="bg-blue-500 rounded-full min-w-6 h-6 text-center font-bold leading-6! flex items-center justify-center"
                size="xs"
                color="white"
              >
                2
              </Paragraph>
              <Paragraph>
                <strong>Practice</strong> — adaptive drills, AI tutor, timed
                mock exams.
              </Paragraph>
            </div>
            <div className="flex gap-3 items-center">
              <Paragraph
                className="bg-blue-500 rounded-full min-w-6 h-6 text-center font-bold leading-6! flex items-center justify-center"
                size="xs"
                color="white"
              >
                3
              </Paragraph>
              <Paragraph>
                <strong>Pass</strong> — hit 90% readiness, book your slot, get
                licensed.
              </Paragraph>
            </div>
          </div>
          <Separator />
          <Paragraph size="sm" color="muted">
            DriveLane is an independent study platform. We prepare you for the
            test — the DMV issues the license.
          </Paragraph>
        </div>
      </div>
    </section>
  );
}
