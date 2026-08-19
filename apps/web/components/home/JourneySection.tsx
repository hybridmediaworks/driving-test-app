import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Button from "../ui/Button";

// Subtle dark panel gradient used behind the step media (from Figma).
const darkCardBg =
  "linear-gradient(140.58deg, rgb(21,22,28) 0%, rgb(21,22,28) 2.85%, rgb(27,28,36) 2.85%, rgb(27,28,36) 5.69%)";

export default function JourneySection() {
  return (
    <section className="bg-background2 px-5 py-16 lg:py-30">
      <div className="mx-auto max-w-container space-y-15">
        {/* Heading block */}
        <div className="mx-auto flex max-w-170 flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-4">
              <p className="border-b border-blue-100 px-3.5 pt-[5px] pb-1.5 text-xs font-bold tracking-[1.2px] text-blue-700 uppercase">
                ✦&nbsp;&nbsp;The journey
              </p>
              <Heading as="h2" className="text-center">
                From zero
                <br />
                to licensed.
              </Heading>
            </div>
            <Paragraph className="pt-0.5 text-center" size="xl">
              Three steps. One outcome. The card in your wallet.
            </Paragraph>
          </div>
          <Button
            href="/how-it-works"
            icon={ArrowRight}
            iconPosition="right"
            className="px-4! shadow-[0_12px_8px_rgba(0,0,0,0.08),0_4px_3px_rgba(0,0,0,0.03)]"
          >
            How it works
          </Button>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line behind the circles */}
          <div className="absolute top-[26px] left-[16%] z-0 hidden h-0.5 w-[68%] bg-neutral-300 lg:block" />
          <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-red-500 text-lg font-bold tracking-[-0.176px] text-neutral-100">
                1
              </div>
              <div className="flex w-full flex-col items-center gap-3">
                <Heading as="h3" size="sm" className="pt-3 text-center">
                  Start your journey
                </Heading>
                <Paragraph className="max-w-75 text-center">
                  Tell us your state and test type. Your plan builds itself in
                  seconds.
                </Paragraph>
              </div>
              <div
                className="relative h-58 w-full overflow-hidden rounded-2xl"
                style={{ background: darkCardBg }}
              >
                <Image
                  src="/journey/student-phone.jpg"
                  alt="Student planning their driving test on a phone"
                  fill
                  quality={85}
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-[54px] w-[54px]">
                <div className="absolute -top-1.5 -left-1.5 h-[66px] w-[66px] rounded-full bg-yellow-100" />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-yellow-500 text-lg font-bold tracking-[-0.176px] text-neutral-100">
                  2
                </div>
              </div>
              <div className="flex w-full flex-col items-center gap-3">
                <Heading as="h3" size="sm" className="pt-3 text-center">
                  Train like you mean it
                </Heading>
                <Paragraph className="max-w-75 text-center">
                  AI tutor, mock exams, and drills sharpen exactly the areas you
                  fail.
                </Paragraph>
              </div>
              <div
                className="flex h-58 w-full flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#23242b] px-4 text-center"
                style={{ background: darkCardBg }}
              >
                <p className="text-xs font-semibold text-[#c9cad2]">
                  [IMAGE/UI] AI Tutor In Use
                </p>
                <p className="text-[10.5px] tracking-[0.42px] text-[#7b7c86]">
                  480 × 560 · chat UI, tilted
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-green-500 text-lg font-bold tracking-[-0.176px] text-neutral-100">
                3
              </div>
              <div className="flex w-full flex-col items-center gap-3">
                <Heading as="h3" size="sm" className="pt-3 text-center">
                  Arrive licensed.
                </Heading>
                <Paragraph className="max-w-75 text-center">
                  Walk in calm. Walk out with the only card that matters.
                </Paragraph>
              </div>
              <div className="flex h-58 w-full items-center justify-center">
                <Image
                  src="/licence.png"
                  alt="Sample California driver license"
                  width={329}
                  height={208}
                  className="w-full max-w-[328px] rotate-8 rounded-[22px]"
                  style={{
                    boxShadow:
                      "0 1.095px 0 0 rgba(255, 255, 255, 0.22) inset, 0 0 0 1.095px rgba(255, 255, 255, 0.09) inset, 0 26.281px 54.752px -24.091px rgba(8, 9, 12, 0.55), 0 8.76px 21.901px -13.141px rgba(8, 9, 12, 0.45)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
