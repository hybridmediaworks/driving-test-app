"use client";

import * as motion from "motion/react-client";
import type { ReactNode } from "react";

/**
 * A browse page's masthead: title, one line of context, and how many rows the current filters
 * match.
 *
 * The count is the reason this exists as a component rather than two tags of markup. Until the
 * first response lands there is no count, and printing "0 results" in that gap is a lie the page
 * then has to take back — so the slot holds a placeholder bar instead, the same width the number
 * will occupy.
 */
export default function BrowseHeader({
  title,
  description,
  total,
  unit,
  action,
}: {
  title: string;
  description: string;
  /** `null` until the first response arrives. */
  total: number | null;
  /** Plural noun for the count line, e.g. "tests". */
  unit: string;
  /** An optional primary action for the whole page, e.g. flashcards' "Start studying". */
  action?: ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="space-y-2">
        <h1 className="font-overpass text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{description}</p>
        <p className="flex h-5 items-center text-sm text-muted-foreground">
          {total === null ? (
            <span className="h-3.5 w-24 animate-pulse rounded bg-muted" aria-label="Counting results" />
          ) : (
            <span className="tabular-nums">
              {total.toLocaleString()} {total === 1 ? unit.replace(/s$/, "") : unit}
            </span>
          )}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
