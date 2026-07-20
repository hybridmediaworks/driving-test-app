import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Button from "../ui/Button";
import { ArrowRight } from "lucide-react";

export default function JourneySection() {
  return (
    <section className="bg-[#F2F1EC] px-5 py-15 lg:py-30">
      <div className="mx-auto max-w-container space-y-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
            size="xs"
            color="primary"
          >
            ✦ The journey
          </Paragraph>
          <Heading as="h2" className="max-w-82.5 text-center">
            From zero to licensed.
          </Heading>
          <Paragraph className="max-w-161 text-center" size="xl">
            Three steps. One outcome. The card in your wallet.
          </Paragraph>
          <Button href="/how-it-works">
            How It Works <ArrowRight />
          </Button>
        </div>
        <div className="relative">
          <div className="absolute top-7 left-[16%] z-0 hidden h-px w-[68%] bg-linear-to-r from-[#2B59FF] to-[#B49CFF] lg:block" />
          <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="text-center">
              <Paragraph
                className="mx-auto flex h-13.5 w-13.5 items-center justify-center rounded-full bg-[#16171C] font-bold"
                size="lg"
                color="white"
              >
                1
              </Paragraph>
              <div className="space-y-3 py-6">
                <Heading size="xs">Start your journey</Heading>
                <Paragraph className="mx-auto max-w-75">
                  Tell us your state and test type. Your plan builds itself in
                  seconds.
                </Paragraph>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/step1.png" alt="" className="mx-auto" />
            </div>
            <div className="text-center">
              <Paragraph
                className="mx-auto flex h-13.5 w-13.5 items-center justify-center rounded-full bg-[#2B59FF] font-bold shadow-[0_0_0_6px_rgba(43,89,255,0.18)]"
                size="lg"
                color="white"
              >
                2
              </Paragraph>
              <div className="space-y-3 py-6">
                <Heading size="xs">Train like you mean it</Heading>
                <Paragraph className="mx-auto max-w-75">
                  AI tutor, mock exams, and drills sharpen exactly the areas you
                  fail.
                </Paragraph>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/step1.png" alt="" className="mx-auto" />
            </div>
            <div className="text-center">
              <Paragraph
                className="mx-auto flex h-13.5 w-13.5 items-center justify-center rounded-full bg-white font-bold"
                size="lg"
              >
                3
              </Paragraph>
              <div className="space-y-3 py-6">
                <Heading size="xs">Arrive licensed.</Heading>
                <Paragraph className="mx-auto max-w-75">
                  Walk in calm. Walk out with the only card that matters.
                </Paragraph>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/licence.png"
                alt=""
                className="mx-auto mt-4 rotate-[8deg] rounded-3xl"
                style={{
                  boxShadow:
                    "0 1.095px 0 0 rgba(255, 255, 255, 0.22) inset, 0 0 0 1.095px rgba(255, 255, 255, 0.09) inset, 0 26.281px 54.752px -24.091px rgba(8, 9, 12, 0.55), 0 8.76px 21.901px -13.141px rgba(8, 9, 12, 0.45)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
