import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

/**
 * "Everything that helps you ace it." — four alternating feature rows (text on one
 * side, an illustrated product mockup on the other, sides flipping each row).
 * Pixel-matched to Figma node 1980:9104 (file QOJ34F4OPHkJ5LFrJt9eCA). The mockup
 * images are exported straight from the Figma frames.
 */
type Row = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  cta: string;
  href: string;
  image: string;
  imageW: number;
  imageH: number;
  imageLeft: boolean;
};

const ROWS: Row[] = [
  {
    eyebrow: "AI Powered",
    title: "Learns your weak spots. Fixes them fast.",
    body: "Unlike other apps that serve random questions, DriveLane tracks every topic you struggle with and automatically increases their frequency until you've truly mastered them.",
    bullets: [
      "Spaced repetition algorithm",
      "Per-topic accuracy tracking",
      "Readiness score updated in real time",
    ],
    cta: "See how it works",
    href: "/features-overview",
    image: "/toolkit/row1-essentials-s.png",
    imageW: 724,
    imageH: 640,
    imageLeft: false,
  },
  {
    eyebrow: "Gamified",
    title: "Study streaks that actually work.",
    body: "Consistency beats cramming every time. DriveLane's streak system, milestone rewards, and daily goals keep you coming back — until passing feels inevitable.",
    bullets: [
      "Daily streak tracking with fire emojis",
      "Milestone badges and XP rewards",
      "15-min daily goals, not marathon sessions",
    ],
    cta: "Start your streak",
    href: "/features-overview",
    image: "/toolkit/row2-streak-s.png",
    imageW: 724,
    imageH: 616,
    imageLeft: true,
  },
  {
    eyebrow: "Exam simulator",
    title: "The real test will feel familiar.",
    body: "Our exam simulator replicates the exact format, time limit, question count, and passing threshold of your state's real DMV written test. Walk in like you've done it before.",
    bullets: [
      "State-specific passing thresholds",
      "Timed, no hints, full pressure",
      "Detailed post-test breakdown",
    ],
    cta: "Try a mock exam",
    href: "/features-overview",
    image: "/toolkit/row3-quiz-s.png",
    imageW: 732,
    imageH: 640,
    imageLeft: false,
  },
  {
    eyebrow: "Driving simulator",
    title: "Practice the road before you drive it.",
    body: "Interactive video simulations for hazard perception, intersections, and night driving. Take each scenario from the driver's seat, see the right response replayed, and build instinct — rehearse in minutes, remember it for life.",
    bullets: [
      "All road signs with meanings",
      "Speed limit quick-reference by zone",
      "Right-of-way visual diagrams",
    ],
    cta: "Download a sample",
    href: "/features-overview",
    image: "/toolkit/row4-street-s.png",
    imageW: 732,
    imageH: 640,
    imageLeft: true,
  },
];

export default function ToolkitSection() {
  return (
    <section className="bg-background py-16 lg:py-[120px]">
      <div className="mx-auto max-w-container px-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="flex items-center gap-1.5 border-b border-blue-100 px-[14px] pt-[5px] pb-[6px] text-xs font-bold tracking-[1.2px] text-blue-700 uppercase">
            <span aria-hidden="true">✦</span>
            The toolkit
          </p>
          <div className="flex flex-col items-center gap-4">
            <Heading as="h2" className="max-w-[560px] text-center">
              Everything that helps you ace it.
            </Heading>
            <Paragraph className="max-w-[672px] text-center" size="xl">
              DriveLane is built around how memory actually works — spaced
              repetition, active recall, and targeted weakness training.
            </Paragraph>
          </div>
        </div>

        {/* Alternating rows */}
        <div className="mt-14 flex flex-col gap-16 lg:mt-[60px] lg:gap-[60px]">
          {ROWS.map((row) => (
            <div
              key={row.title}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-24"
            >
              {/* Text */}
              <div className={row.imageLeft ? "lg:order-2" : "lg:order-1"}>
                <p className="inline-flex items-center gap-1.5 border-b border-blue-100 pb-1.5 text-xs font-bold tracking-[1.2px] text-blue-700 uppercase">
                  <span aria-hidden="true">✦</span>
                  {row.eyebrow}
                </p>
                <h3 className="mt-6 font-sora text-[32px] leading-[1.12] font-semibold tracking-[-0.96px] text-neutral-900 sm:text-[40px] lg:text-[48px] lg:leading-[56px]">
                  {row.title}
                </h3>
                <Paragraph className="mt-4 max-w-[562px]" size="md">
                  {row.body}
                </Paragraph>
                <ul className="mt-6 flex flex-col gap-3">
                  {row.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-blue-500">
                        <Check className="size-4 text-white" strokeWidth={3} />
                      </span>
                      <span className="text-base leading-6 text-neutral-700">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={row.href}
                  className="group mt-6 inline-flex items-center gap-1.5 text-base font-semibold text-blue-600"
                >
                  {row.cta}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Image — displayed at ~its natural width so the card matches the
                  Figma size; the soft shadow overflows the equal-width column (the
                  section shares the image's #FAFAF7 background so it blends). */}
              <div
                className={`flex justify-center ${
                  row.imageLeft ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <Image
                  src={row.image}
                  alt=""
                  width={row.imageW}
                  height={row.imageH}
                  quality={92}
                  sizes="(max-width: 1024px) 100vw, 724px"
                  className="h-auto w-full lg:w-[724px] lg:max-w-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
