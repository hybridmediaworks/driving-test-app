"use client";

import Link from "next/link";
import { Bookmark, BookOpen } from "lucide-react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

/**
 * "The Quiz Vault" — the two-up Missed / Bookmarked cards beside the laptop mockup
 * (Figma node 4147:8408). Both cards go to the dashboard, where the real "Weak Spots" retest
 * list lives.
 */
const CARDS = [
  {
    icon: BookOpen,
    title: "Missed Questions",
    body: "Full text, searchable",
    href: "/dashboard",
  },
  {
    icon: Bookmark,
    title: "Bookmarked Questions",
    body: "Full text, searchable",
    href: "/dashboard",
  },
];

export default function QuizVaultSection() {
  return (
    <section className="bg-linear-to-b from-background to-background2 px-5 py-15 lg:py-30">
      <div className="mx-auto flex max-w-container flex-col items-center gap-10 lg:flex-row lg:gap-15">
        <div className="flex w-full flex-col justify-between gap-10 lg:w-[533px] lg:shrink-0">
          <div className="space-y-4">
            <Heading as="h2">The Quiz Vault</Heading>
            <Paragraph color="muted" className="max-w-[420px]">
              Your personalized Quiz Vault automatically retests you on all your
              missed questions until you nail every single one. No shame - we
              all have weaknesses!
            </Paragraph>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {CARDS.map(({ icon: Icon, title, body, href }) => (
              <Link
                key={title}
                href={href}
                className="flex flex-col items-start gap-4 rounded-3xl border border-background2 bg-white p-6 drop-shadow-[0px_20px_20px_rgba(11,11,13,0.1)] transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="flex size-15 items-center justify-center rounded-lg border border-blue-50 bg-blue-50 text-blue-700">
                  <Icon className="size-8" />
                </span>
                <div className="space-y-2">
                  <h3 className="font-sora text-2xl leading-8 font-semibold text-neutral-900">
                    {title}
                  </h3>
                  <Paragraph>{body}</Paragraph>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="w-full min-w-0 lg:flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/state-hub/quizvault-macbook.png"
            alt="A DriveLane practice question and progress panel shown on a laptop"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
