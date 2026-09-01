import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * "Learn Your Way. Anytime, Anywhere" — the exact Figma blurred forest-road
 * backdrop (node 1922:3976) with a white headline + App Store / Google Play /
 * Browser buttons on the left, and the laptop + phone device mockup (node
 * 1922:8503) on the right that BLEEDS off the right edge, exactly as in Figma.
 * Matched to node 1918:3736 (file QOJ34F4OPHkJ5LFrJt9eCA).
 */
export default function LearnSection() {
  const device = (
    <Image
      src="/learn/device-final.png"
      alt="DriveLane running on a laptop and phone"
      width={804}
      height={637}
      quality={92}
      sizes="(max-width: 1024px) 100vw, 840px"
      className="h-auto w-full"
    />
  );

  return (
    <section className="relative overflow-hidden">
      {/* Exact Figma blurred forest-road backdrop + subtle left dark gradient */}
      <div aria-hidden className="absolute inset-0 z-0">
        <Image
          src="/learn/forest-bg.png"
          alt=""
          fill
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/25 to-transparent" />
      </div>

      {/* Device mockup — desktop: absolute, bleeds off the right edge (Figma
          composition). The laptop base is a dark blue-grey (like Figma, reflecting
          the forest), so it blends into the backdrop instead of showing as white. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[6px] bottom-[-24px] z-[5] hidden w-[41%] max-w-[810px] lg:block"
      >
        {device}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-container flex-col justify-center px-5 py-16 lg:h-[757px] lg:py-0">
        <div className="max-w-[593px]">
          <h2 className="font-sora text-[40px] leading-[1.1] font-semibold tracking-[-1.12px] text-neutral-50 lg:text-[56px] lg:leading-[64px]">
            Learn Your Way.
            <br />
            Anytime, Anywhere
          </h2>
          <p className="mt-4 max-w-[593px] text-lg leading-7 font-medium text-neutral-200">
            Your course, your device, your pace. Video, text, or interactive
            quizzes. Our smart system adapts to how you learn best.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="#" aria-label="Download on the App Store">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/learn/appstore-dark-t.png"
                alt="Download on the App Store"
                className="h-[52px] w-auto"
              />
            </Link>
            <Link href="#" aria-label="Get it on Google Play">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/learn/googleplay-dark-t.png"
                alt="Get it on Google Play"
                className="h-[52px] w-auto"
              />
            </Link>
            <Link
              href="#"
              aria-label="Open in Browser"
              className="flex h-[52px] items-center gap-2.5 rounded-[8px] bg-neutral-900 px-4 text-white"
            >
              <Globe className="size-6 shrink-0" />
              <span className="flex flex-col leading-none">
                <span className="text-[10px] font-medium tracking-wide text-neutral-300 uppercase">
                  Get it on
                </span>
                <span className="text-lg font-semibold">Browser</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Device mockup — mobile: in flow below the text */}
        <div className="mt-12 w-full max-w-[560px] lg:hidden">{device}</div>
      </div>
    </section>
  );
}
