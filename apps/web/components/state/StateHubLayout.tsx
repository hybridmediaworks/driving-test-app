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
