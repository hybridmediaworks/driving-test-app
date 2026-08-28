import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { cn } from "@/lib/utils";

/**
 * "4.8 million passed and counting" — a centered header over a four-column
 * testimonial masonry (two vertical photo cards, one horizontal photo card, and
 * six avatar cards), with a centered "View all" button beneath. Pixel-matched to
 * Figma node 1933:8802 (file QOJ34F4OPHkJ5LFrJt9eCA). Photos/avatars reuse the
 * project's existing driver imagery.
 */
function Stars() {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="size-[13px] fill-yellow-500 text-yellow-500"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

const CARD =
  "rounded-[16px] border border-blue-100 bg-white shadow-[0px_4px_12px_0px_rgba(157,175,181,0.25)]";

function Person({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="leading-tight">
        <span className="text-sm font-bold text-[#293238]">{name}</span>
        <br />
        <span className="text-sm text-[#7d7a7a]">{role}</span>
      </p>
      <Stars />
    </div>
  );
}

/* Vertical photo testimonial — image on top, quote, then name + stars. */
function PhotoCard({
  image,
  quote,
  name,
  role,
}: {
  image: string;
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <figure className={cn(CARD, "flex flex-col gap-5 pb-5")}>
      <div className="relative aspect-[260/181] w-full overflow-hidden rounded-[16px]">
        <Image src={image} alt="" fill sizes="260px" className="object-cover" />
      </div>
      <blockquote className="px-5 text-base leading-[1.5] text-[#232527]">
        {quote}
      </blockquote>
      <figcaption className="px-5">
        <Person name={name} role={role} />
      </figcaption>
    </figure>
  );
}

/* Horizontal photo testimonial — image on the left, quote + name on the right. */
function HorizontalCard({
  image,
  quote,
  name,
  role,
}: {
  image: string;
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <figure className={cn(CARD, "flex items-stretch gap-5 overflow-hidden")}>
      <div className="relative w-[44%] shrink-0 overflow-hidden rounded-[16px]">
        <Image src={image} alt="" fill sizes="220px" className="object-cover" />
      </div>
      <div className="flex flex-col gap-4 py-5 pr-5">
        <blockquote className="text-base leading-[1.5] text-[#232527]">
          {quote}
        </blockquote>
        <Person name={name} role={role} />
      </div>
    </figure>
  );
}

/* Avatar testimonial — avatar + name/stars on top, quote below. */
function AvatarCard({
  avatar,
  quote,
  name,
  role,
}: {
  avatar: string;
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <figure className={cn(CARD, "flex flex-col")}>
      <div className="flex items-start gap-3.5 px-5 pt-5">
        <span className="relative size-[60px] shrink-0 overflow-hidden rounded-full">
          <Image src={avatar} alt="" fill sizes="60px" className="object-cover" />
        </span>
        <Person name={name} role={role} />
      </div>
      <blockquote className="p-5 text-base leading-normal text-[#293238]">
        {quote}
      </blockquote>
    </figure>
  );
}

const ROLE = "Verified learner";

export default function SuccessStories({
  className,
}: {
  className?: string;
}) {
  return (
    <section className={cn("bg-background px-5 py-16 lg:py-[120px]", className)}>
      <div className="mx-auto flex max-w-container flex-col items-center gap-[50px]">
        {/* Header — centered */}
        <div className="flex max-w-[546px] flex-col items-center gap-6 text-center">
          <p className="flex items-center gap-1.5 border-b border-blue-100 px-[14px] pt-[5px] pb-[6px] text-xs font-bold tracking-[1.2px] text-blue-700 uppercase">
            <span aria-hidden="true">✦</span>
            Success stories
          </p>
          <Heading as="h2" className="text-center">
            4.8 million passed and counting
          </Heading>
        </div>

        {/* Masonry — four columns */}
        <div className="flex w-full flex-col justify-center gap-5 lg:flex-row lg:items-start">
          {/* Column 1 */}
          <div className="flex flex-col gap-5 lg:w-[260px]">
            <PhotoCard
              image="/hero/deck-8c.jpg"
              quote="Passed my written test on the first try. The practice questions were almost identical to the real DMV exam — I walked in completely calm."
              name="Sarah Whitfield"
              role={ROLE}
            />
            <AvatarCard
              avatar="/Avatar.png"
              quote="Failed twice with the manual. Two weeks on DriveLane and I finally passed."
              name="Jon Sari"
              role={ROLE}
            />
          </div>

          {/* Column 2 (wide) */}
          <div className="flex flex-col gap-5 lg:w-[496px]">
            <HorizontalCard
              image="/hero/deck-7c.jpg"
              quote="The mock exams feel exactly like the real thing. By test day nothing surprised me at all."
              name="Rahul Deb"
              role={ROLE}
            />
            <AvatarCard
              avatar="/Avatar2.png"
              quote="I studied on my commute using voice mode and aced the road-signs section without ever opening the booklet. Exactly the prep I needed."
              name="Ahmed Saimoon"
              role={ROLE}
            />
            <AvatarCard
              avatar="/Avatar3.png"
              quote="Clear explanations on every wrong answer — that's what finally made the rules stick for me after months of struggling."
              name="Sakib Mo"
              role={ROLE}
            />
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-5 lg:w-[284px]">
            <AvatarCard
              avatar="/Avatar4.png"
              quote="Went from guessing to confident in a week. The readiness score told me exactly when I was ready to book the test."
              name="Nazmul Karim"
              role={ROLE}
            />
            <AvatarCard
              avatar="/Avatar5.png"
              quote="Best money I never spent — the free tests alone got me my license. Highly recommend to any new driver."
              name="Amir Khan"
              role={ROLE}
            />
          </div>

          {/* Column 4 */}
          <div className="flex flex-col gap-5 lg:w-[260px]">
            <AvatarCard
              avatar="/Avatar6.png"
              quote="Simple, fast, and it actually works. Passed first attempt and told all my friends."
              name="Maria Lopez"
              role={ROLE}
            />
            <PhotoCard
              image="/hero/deck-3c.jpg"
              quote="The flashcards locked every sign into my memory. Test day felt like review, not a test."
              name="David Chen"
              role={ROLE}
            />
          </div>
        </div>

        {/* View all — centered */}
        <button
          type="button"
          className="group inline-flex items-center gap-2 rounded-full border border-white/50 bg-linear-to-r from-[#3b82f6] to-[#1e40af] px-5 py-4 text-base leading-6 font-semibold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        >
          <span className="whitespace-nowrap">View all success stories</span>
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
}
