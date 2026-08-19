"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import StateSelectModal from "@/components/home/StateSelectModal";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

export default function CTASection({ href }: { href?: string } = {}) {
  const { selectedState, hasStoredState } = useWebLayout();
  const [showStateModal, setShowStateModal] = useState(false);

  const stateHref =
    href ?? (hasStoredState ? `/${stateToSlug(selectedState)}` : undefined);

  function onStartClick() {
    if (!hasStoredState) {
      setShowStateModal(true);
    }
  }

  const buttonLabel = hasStoredState
    ? `Start Your Free ${selectedState} Practice Test`
    : "Start Your Free Practice Test";

  const buttonClass =
    "inline-flex h-14 cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-blue-500 to-blue-800 py-0 pr-1 pl-5 text-base font-semibold text-white shadow-xs drop-shadow-[0px_12px_8px_rgba(0,0,0,0.08),0px_4px_3px_rgba(0,0,0,0.03)] transition-opacity hover:opacity-95";

  const buttonInner = (
    <>
      <span>{buttonLabel}</span>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/[0.16]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="size-6 -rotate-45"
        >
          <path
            d="M2.4 12H21.6M14.4 19.2L21.6 12L14.4 4.8"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );

  return (
    // Split background: cream on the top half, footer-grey on the bottom half, so
    // the card straddles the boundary and the grey flows seamlessly into the footer.
    <section
      className="px-5 py-8 lg:py-10"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, #fafaf7 50%, #f2f1ec 50%)",
      }}
    >
      <div className="mx-auto max-w-container">
        <div
          className="relative overflow-hidden rounded-[48px] shadow-[0px_30px_64px_-28px_rgba(16,24,40,0.3),0px_8px_18px_0px_rgba(16,24,40,0.07)]"
          style={{
            backgroundImage:
              "linear-gradient(-17.34deg, rgb(23, 37, 84) 14.5%, rgb(13, 20, 44) 85.5%)",
          }}
        >
          {/* Driver photo — anchored right, faded into the navy on its left edge */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[66%] md:block"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, #000 72%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, #000 72%)",
            }}
          >
            <Image
              src="/cta/cta-driver.webp"
              alt="Smiling driver holding a US driver license"
              fill
              quality={92}
              sizes="(min-width: 768px) 66vw, 0px"
              className="object-cover object-[30%_center]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 px-8 py-14 sm:px-12 sm:py-20 lg:py-[120px] lg:pr-8 lg:pl-[120px]">
            <div className="max-w-[566px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-blue-100 py-[7px] pr-[15px] pl-[7px]">
              <span className="rounded-full bg-blue-500 px-2 py-[3px] text-xs leading-[18px] font-bold text-white">
                Start today
              </span>
              <span className="text-sm font-medium text-neutral-500">
                Free, no credit card required
              </span>
            </div>

            <Heading as="h2" className="mt-6 text-neutral-100!">
              Start your DMV test preparations today
            </Heading>

            <Paragraph
              size="xl"
              className="mt-3 mx-auto max-w-[530px] text-neutral-300!"
            >
              Join 4.8 million drivers who prepared smarter, not harder. Your
              first practice test is completely free.
            </Paragraph>

            <div className="mt-6">
              {stateHref ? (
                <Link href={stateHref} className={buttonClass}>
                  {buttonInner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onStartClick}
                  className={buttonClass}
                >
                  {buttonInner}
                </button>
              )}
            </div>
            </div>
          </div>

          {false && <StateSelectModal
            open={showStateModal}
            onClose={() => setShowStateModal(false)}
          />}
        </div>
      </div>
    </section>
  );
}
