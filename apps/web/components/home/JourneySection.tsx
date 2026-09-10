import Image from "next/image";
import { ArrowRight, Lightbulb, Send } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import Button from "../ui/Button";

// Subtle dark panel gradient used behind the step media (from Figma).
const darkCardBg =
  "linear-gradient(140.58deg, rgb(21,22,28) 0%, rgb(21,22,28) 2.85%, rgb(27,28,36) 2.85%, rgb(27,28,36) 5.69%)";

export default function JourneySection({ variant = "home" }: { variant?: "home" | "state" } = {}) {
  const isState = variant === "state";
  return (
    <section className="bg-background2 px-5 py-16 lg:py-30">
      <div className="mx-auto max-w-container space-y-15">
        {/* Heading block */}
        <div className="mx-auto flex max-w-170 flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-4">
              {/* The state practice-hub frame drops the eyebrow, runs the headline on one line,
                  and shows the real AI-tutor dialog as step 2's media (Figma
                  M811hqlEYxeqrj8vxOFqnV, node 4260:11379); the home frame keeps the eyebrow, the
                  two-line headline, and the design's own placeholder plate. */}
              {!isState && (
                <p className="border-b border-blue-100 px-3.5 pt-[5px] pb-1.5 text-xs font-bold tracking-[1.2px] text-blue-700 dark:text-blue-300 uppercase">
                  ✦&nbsp;&nbsp;The journey
                </p>
              )}
              <Heading as="h2" className="text-center">
                {isState ? (
                  "From zero to licensed."
                ) : (
                  <>
                    From zero
                    <br />
                    to licensed.
                  </>
                )}
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
          <div className="absolute top-[26px] left-[16%] z-0 hidden h-0.5 w-[68%] bg-neutral-300 dark:bg-neutral-600 lg:block" />
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
              {isState ? (
                <AiTutorDialog />
              ) : (
                <div
                  className="flex h-58 w-full flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#23242b] px-4 text-center"
                  style={{ background: darkCardBg }}
                >
                  <p className="text-xs font-semibold text-[#c9cad2]">
                    [IMAGE/UI] AI Tutor In Use
                  </p>
                  <p className="text-[10.5px] tracking-[0.42px] text-[#7b7c86] dark:text-neutral-400">
                    480 × 560 · chat UI, tilted
                  </p>
                </div>
              )}
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

/**
 * Step 2's media on the state practice hub — the AI-tutor prompt card from Figma (node
 * 4358:14111), sitting on the same white/mint wash the score-distribution card uses. Static by
 * design: it's a picture of the tutor, not the tutor itself, which lives inside the quiz player.
 */
function AiTutorDialog() {
  return (
    <div className="flex h-58 w-full items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(120%_140%_at_0%_0%,#ffffff_0%,#f0fdf4_34%,#ffffff_54%,#f0fdf4_77%,#ffffff_100%)] px-4 shadow-[0px_4px_24px_0px_rgba(157,175,181,0.25)]">
      <div className="w-full max-w-96.5 rounded-xl border border-background2 bg-white p-4 text-left shadow-[0px_12px_38px_-20px_rgba(23,37,84,0.2)]">
        <p className="text-sm leading-5.5 text-neutral-700">
          Need a hint or a quick explanation? Tap the button or type a question for instant help.
        </p>
        <div className="mt-3 flex flex-col gap-4.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Lightbulb className="size-4" />
            Get a Hint
          </span>
          <span className="flex items-center justify-between gap-2 rounded-full border border-neutral-300 bg-white px-3 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <span className="text-xs text-neutral-500">Ask you question here</span>
            <Send className="size-4.5 text-blue-500" />
          </span>
        </div>
      </div>
    </div>
  );
}
