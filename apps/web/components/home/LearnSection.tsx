import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * "Learn Your Way. Anytime, Anywhere" — a blurred dark road backdrop with a white
 * headline, subtitle, and App Store / Google Play / Browser buttons on the left,
 * and a laptop + phone device mockup on the right. Matched to Figma node
 * 1918:3736 (file QOJ34F4OPHkJ5LFrJt9eCA). The device mockup is exported from
 * Figma; the backdrop reuses the project's road photo (blurred + darkened).
 */
export default function LearnSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Blurred dark road backdrop */}
      <div aria-hidden className="absolute inset-0 z-0">
        <Image
          src="/features/road-bg.png"
          alt=""
          fill
          quality={80}
          sizes="100vw"
          className="scale-110 object-cover blur-[8px]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/45 to-black/35" />
      </div>

      <div className="relative z-10 mx-auto max-w-container px-5 py-16 lg:py-[96px]">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {/* Left — text + store buttons */}
          <div className="max-w-[593px] shrink-0">
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
                  src="/appstore.svg"
                  alt="Download on the App Store"
                  className="h-[52px] w-auto"
                />
              </Link>
              <Link href="#" aria-label="Get it on Google Play">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/googleplay.svg"
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
                    Open in
                  </span>
                  <span className="text-lg font-semibold">Browser</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Right — laptop + phone device mockup */}
          <div className="w-full max-w-[560px] lg:max-w-[700px]">
            <Image
              src="/learn/device.png"
              alt="DriveLane running on a laptop and phone"
              width={804}
              height={637}
              quality={92}
              sizes="(max-width: 1024px) 100vw, 700px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
