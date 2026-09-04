"use client";

import { createContext, useContext, type ReactNode } from "react";
import StateSidebar from "@/components/state/StateSidebar";
import { useLearnerProgress } from "@/lib/useLearnerProgress";

/**
 * Whether the progress rail is alongside the page. Sections that lay themselves out edge-to-edge
 * read this so they can adapt to the narrower column — the phase ladder drops a card column, for
 * instance, rather than squeezing four into the space left over.
 */
const SidebarContext = createContext(false);

export function useHasProgressSidebar(): boolean {
  return useContext(SidebarContext);
}

/**
 * Shipped with the component rather than sitting in globals.css. Both rules are meaningless
 * outside this layout, and — more practically — the dev server repeatedly failed to recompile
 * globals.css after edits, silently serving a stale sheet, whereas a <style> rendered from the
 * component hot-reloads with it. React hoists and dedupes this into <head> via `precedence`.
 *
 * .hub-column main > *  — the page's sections live inside the left column, so their backgrounds
 * would stop at the column's edge. This bleeds every top-level band out to the full viewport
 * while pushing its padding back in by the same amount, so the tinted/photographic bands run edge
 * to edge but their contents stay exactly where the column puts them. Direct children of <main>
 * only: a <section>, or the wrapper div the phase ladder sits in. Nested sections inherit the
 * bled parent's box and must not be shifted a second time.
 *
 * --hub-rail-space is everything to the right of the column: the rail (20rem) + the row gap
 * (2.5rem) + the row's right padding (1.25rem).
 *
 * .rail-slide-in — the rail's entrance from the right edge on load, only where it actually sits
 * on the right (xl+); below that it's stacked above the content, where a sideways entrance would
 * read as a layout glitch.
 */
const HUB_STYLES = `
@media (min-width: 80rem) {
  .hub-column { --hub-rail-space: 23.75rem; }

  .hub-column main > * {
    margin-left: -1.25rem;
    margin-right: calc(-1 * var(--hub-rail-space));
    padding-right: calc(1.25rem + var(--hub-rail-space));
  }

  .rail-slide-in {
    animation: rail-slide-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
}

@keyframes rail-slide-in {
  from { opacity: 0; transform: translateX(calc(100% + 20px)); }
  to { opacity: 1; transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .rail-slide-in { animation: none; }
}
`;

/**
 * The state hub's page shell. For a signed-in learner it puts the whole page — the site header
 * included — in a left column, with the progress rail down the right (sticky, so it stays in view
 * the entire way down). Taking the header into the column is what lets the rail start level with
 * it at the very top of the page instead of below it. On narrower screens the rail moves above the
 * content. A signed-out visitor gets the page exactly as it was: full-width header, no column, no
 * reserved space, no wrapper styling at all.
 *
 * The closing CTA and footer stay outside this, full-width, because the CTA's split background is
 * designed to run into the footer edge to edge.
 */
export default function StateHubLayout({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const { progress, reload } = useLearnerProgress();

  if (!progress)
    return (
      <>
        {header}
        {children}
      </>
    );

  return (
    <SidebarContext.Provider value={true}>
      <style href="state-hub-layout" precedence="medium">
        {HUB_STYLES}
      </style>
      <div className="flex flex-col xl:flex-row xl:gap-10 xl:px-5">
        {/* Below xl the column dissolves (`contents`) so header, rail and page can be ordered
            independently — header first, then progress, then the page. From xl it becomes a real
            column again, with the header inside it and the rail alongside. */}
        <div className="hub-column contents xl:block xl:min-w-0 xl:flex-1">
          <div className="max-xl:order-1">{header}</div>
          <div className="max-xl:order-3">{children}</div>
        </div>

        {/* Rail — under the header when stacked, down the right when there's room. */}
        <div className="relative z-20 px-5 pt-6 max-xl:order-2 xl:w-80 xl:shrink-0 xl:px-0 xl:pt-5">
          <div className="xl:sticky xl:top-5">
            {/* Separate element from the sticky one so the entrance transform never becomes the
                containing block for sticky positioning. */}
            <div className="rail-slide-in">
              <StateSidebar progress={progress} onReload={reload} />
            </div>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
