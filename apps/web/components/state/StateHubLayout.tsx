"use client";

import { PanelRightOpen } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import StateSidebar from "@/components/state/StateSidebar";
import { useLearnerProgress } from "@/lib/useLearnerProgress";

const RAIL_HIDDEN_KEY = "progressRailHidden";

function readRailHidden(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(RAIL_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

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

  .rail-slide-out {
    animation: rail-slide-out 0.45s cubic-bezier(0.64, 0, 0.78, 0) both;
  }
}

@keyframes rail-slide-in {
  from { opacity: 0; transform: translateX(calc(100% + 20px)); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes rail-slide-out {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(calc(100% + 20px)); }
}

@media (prefers-reduced-motion: reduce) {
  .rail-slide-in, .rail-slide-out { animation: none; }
}
`;

const RAIL_ANIMATES_QUERY = "(min-width: 80rem) and (prefers-reduced-motion: no-preference)";

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
  const [railHidden, setRailHiddenState] = useState(readRailHidden);
  const [railLeaving, setRailLeaving] = useState(false);

  function hideRail() {
    if (window.matchMedia(RAIL_ANIMATES_QUERY).matches) setRailLeaving(true);
    else setRailHidden(true);
  }

  function setRailHidden(hidden: boolean) {
    setRailHiddenState(hidden);
    try {
      if (hidden) localStorage.setItem(RAIL_HIDDEN_KEY, "1");
      else localStorage.removeItem(RAIL_HIDDEN_KEY);
    } catch {
    }
  }

  if (!progress)
    return (
      <>
        {header}
        {children}
      </>
    );

  if (railHidden)
    return (
      <>
        {header}
        {children}
        <div className="pointer-events-none fixed inset-y-0 right-0 z-40 flex items-center">
          <button
            type="button"
            onClick={() => setRailHidden(false)}
            aria-label="Show your progress"
            className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-l-2xl border border-r-0 border-border bg-white py-3 pr-3 pl-3.5 text-sm font-semibold text-blue-700 shadow-card transition-colors animate-in fade-in slide-in-from-right duration-500 hover:bg-blue-50 motion-reduce:animate-none dark:bg-neutral-800 dark:text-blue-300 dark:hover:bg-blue-500/10"
          >
            <PanelRightOpen className="size-5" />
            <span className="max-sm:sr-only">Your progress</span>
          </button>
        </div>
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
            <div
              className={railLeaving ? "rail-slide-out" : "rail-slide-in"}
              onAnimationEnd={(e) => {
                if (!railLeaving || e.target !== e.currentTarget) return;
                setRailLeaving(false);
                setRailHidden(true);
              }}
            >
              <StateSidebar progress={progress} onReload={reload} onHide={hideRail} />
            </div>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
