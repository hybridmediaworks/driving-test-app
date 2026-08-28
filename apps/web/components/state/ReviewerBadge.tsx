"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { usePrimaryExpert } from "@/lib/useExperts";
import { formatVerifiedMonth } from "@/lib/expert-format";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * The "Accuracy verified {month} by {name}" trust badge shown on state hero sections and the quiz
 * trust bar. Links through to the reviewer's full profile at /experts/{slug}. While the roster is
 * still loading or if the fetch failed (see useExperts), it renders plain, non-linked generic
 * wording. Renders its own inline container, so it replaces the surrounding <Paragraph>/<span>
 * rather than nesting inside one.
 */
export default function ReviewerBadge({
  prefix = "Accuracy verified",
  className,
}: {
  /** Leading words before "{month} by {name}" — e.g. "Verified" in the tighter quiz trust bar. */
  prefix?: string;
  className?: string;
}) {
  const expert = usePrimaryExpert();

  if (!expert) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 leading-relaxed", className)}>
        <BadgeCheck className="h-5 w-5 shrink-0 text-green-700" />
        Expert-reviewed by our editorial team
      </span>
    );
  }

  return (
    <Link
      href={`/experts/${expert.slug}`}
      className={cn(
        "inline-flex items-center gap-1.5 leading-relaxed underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        className,
      )}
    >
      {expert.photo_url ? (
        <Avatar size="sm" className="shrink-0">
          <AvatarImage src={expert.photo_url} alt="" />
          <AvatarFallback>{initialsOf(expert.name)}</AvatarFallback>
        </Avatar>
      ) : (
        <BadgeCheck className="h-5 w-5 shrink-0 text-green-700" />
      )}
      {`${prefix} ${formatVerifiedMonth(expert.verified_at)} by ${expert.name}`}
    </Link>
  );
}
