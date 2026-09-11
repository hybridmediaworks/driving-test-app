"use client";

import { useEffect, useRef } from "react";

/** Below this width the pinned behaviour is off — the section just flows normally. */
const MIN_WIDTH = 1024;

/** Breathing room left above and below the parked block, split evenly. */
const VIEWPORT_GUTTER = 96;

/** Don't pin on a screen too short for the block to look deliberate. */
const MIN_VIEWPORT_HEIGHT = 600;

/**
 * Locks a section in place while its inner content scrolls past, then releases the page — the
 * "pin and scroll" pattern, and it behaves the same going back up.
 *
 * The outer box is made taller by exactly the content's overflow so the page has that much extra
 * to scroll through, the visible part is stuck to the top of the viewport for that stretch, and
 * the content is translated in step with how far the page has moved through it. Because the offset
 * is derived from the scroll position rather than accumulated, scrolling back up rewinds it
 * exactly.
 *
 * The page itself never stops scrolling, so wheel, trackpad, touch, keyboard and scrollbar
 * dragging all behave normally and nothing is preventDefault-ed — it only *looks* like the page
 * pauses. While parked the block is sized to fill the screen, so the pause reads as the section
 * taking over rather than as a blank gap.
 *
 * Styles are written straight to the nodes: a scroll-linked transform shouldn't re-render the tree
 * on every frame. Off under 1024px, on very short screens, and whenever the content already fits.
 */
export function usePinnedScroll(contentKey: unknown = null) {
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const spacer = spacerRef.current;
    const sticky = stickyRef.current;
    const viewport = viewportRef.current;
    const content = contentRef.current;
    // Bails out until the section actually has content — `contentKey` brings the effect back
    // once it does (the questions arrive from the API after the first render).
    if (!spacer || !sticky || !viewport || !content) return;

    let overflow = 0;
    let stickyTop = 0;
    let frame = 0;

    const reset = () => {
      spacer.style.height = "";
      viewport.style.height = "";
      sticky.style.position = "";
      sticky.style.top = "";
      content.style.transform = "";
    };

    const apply = () => {
      const travelled = stickyTop - spacer.getBoundingClientRect().top;
      const offset = Math.min(Math.max(travelled, 0), overflow);
      content.style.transform = `translate3d(0, ${-offset}px, 0)`;
    };

    const measure = () => {
      if (window.innerWidth < MIN_WIDTH || window.innerHeight < MIN_VIEWPORT_HEIGHT) {
        overflow = 0;
        reset();
        return;
      }

      // Fill the screen while parked. At its design height the block would leave a couple of
      // hundred pixels of empty page above and below it for the whole pinned stretch, which reads
      // as a blank screen rather than the section taking over.
      viewport.style.height = `${window.innerHeight - VIEWPORT_GUTTER}px`;
      overflow = Math.max(0, content.scrollHeight - viewport.clientHeight);

      if (overflow === 0) {
        reset();
        return;
      }

      stickyTop = Math.max(0, Math.round((window.innerHeight - sticky.offsetHeight) / 2));
      // Height, not padding: a sticky child is constrained by its parent's *content* box, and
      // padding sits outside that — with padding alone the box is exactly the child's height and
      // there is nowhere for it to stick.
      spacer.style.height = `${sticky.offsetHeight + overflow}px`;
      sticky.style.position = "sticky";
      sticky.style.top = `${stickyTop}px`;
      apply();
    };

    const onScroll = () => {
      if (overflow === 0) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };

    measure();

    // The content's height changes as answers are revealed, so re-measure when it does.
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(sticky);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      reset();
    };
  }, [contentKey]);

  return { spacerRef, stickyRef, viewportRef, contentRef };
}
