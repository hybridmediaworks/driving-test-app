"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

export type HeroSegment = { label: string; value: number; color: string };
export type HeroFigure = { label: string; value: number; href: string };

/** Vehicle names are stored lowercase; CDL is an initialism, the rest are ordinary words. */
function formatVehicle(name: string): string {
  return name.toLowerCase() === "cdl"
    ? "CDL"
    : name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * The dashboard's headline: the size of the library, broken down by vehicle type.
 *
 * It leads with the catalogue rather than with today's traffic on purpose. Today's figures are
 * the ones an operator checks, but on a quiet morning they are zero, and a dashboard whose
 * largest element reads "0" tells the truth in the least useful way available. The library is
 * both the bigger number and the more honest headline: it is what the product actually is.
 *
 * An ordinary card, deliberately — its weight comes from scale and type, not a coloured panel.
 * The figure is set in Overpass, which descends from the lettering on US road signs.
 */
export default function HeroStat({
  label,
  value,
  sublabel,
  segments,
  figures,
  className = "",
}: {
  label: string;
  value: number;
  sublabel: string;
  /** Parts of the whole, largest first. Rendered as one bar, not a stack of cards. */
  segments: HeroSegment[];
  /** The rest of the catalogue, along the foot of the card. */
  figures: HeroFigure[];
  /** The shared hover treatment, passed in so every card on the page lifts identically. */
  className?: string;
}) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = numberRef.current;
    if (!node) return;

    if (reduced) {
      node.textContent = value.toLocaleString();
      return;
    }

    // Counts like an odometer rolling over, not a generic ease-out: slower at the end, so a
    // six-figure number settles rather than snapping.
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString();
      },
    });

    return () => controls.stop();
  }, [value, reduced]);

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  // Everything the library is, in one card: the headline, what it is made of, and the rest of the
  // catalogue along the foot. Carrying the supporting figures here rather than in a separate strip
  // is what lets this card fill the height the rail beside it sets — before, the same content sat
  // in two cards and left a hole down the middle of this one.
  return (
    <div
      className={`flex h-full flex-col justify-between gap-6 rounded-xl border border-border bg-card p-6 sm:p-8 ${className}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>

      <div>
        <span
          ref={numberRef}
          className="font-overpass text-[clamp(2.5rem,5vw,3.75rem)] leading-none font-bold tracking-tight tabular-nums"
        >
          {value.toLocaleString()}
        </span>
        <p className="mt-3 text-sm text-muted-foreground">{sublabel}</p>
      </div>

      <div className="space-y-3">
        {/* One bar, with a 2px gap between segments so adjacent fills stay distinct without a
            border drawing itself around every part. */}
        <div
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
          aria-hidden
        >
          {segments.map((segment) => (
            <span
              key={segment.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(segment.value / total) * 100}%`,
                backgroundColor: segment.color,
              }}
            />
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {/* `capitalize` turned the stored "cdl" into "Cdl". An initialism needs the whole
                  word upper-cased, and only CSS was ever deciding that. */}
              <span>{formatVehicle(segment.label)}</span>
              <span className="text-muted-foreground tabular-nums">
                {segment.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4">
        {figures.map((figure) => (
          <Link
            key={figure.label}
            href={figure.href}
            className="-m-1 rounded-lg p-1 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none"
          >
            <p className="font-overpass text-xl font-bold tabular-nums">
              {figure.value.toLocaleString()}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {figure.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
