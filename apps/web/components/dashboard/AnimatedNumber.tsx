"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

/**
 * A figure that counts up to its value once, the first time it is on screen.
 *
 * The span's text is written imperatively from the motion value rather than through React state:
 * a count-up re-renders roughly sixty times a second, and routing that through the component tree
 * makes the rest of the dashboard stutter on a slow machine for no visible gain.
 *
 * Under `prefers-reduced-motion` the final value is printed immediately. Motion is not decoration
 * here — counting digits are exactly the kind of movement that makes some people ill.
 */
export default function AnimatedNumber({
  value,
  format = (n: number) => Math.round(n).toLocaleString(),
  duration = 0.8,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduced) {
      node.textContent = format(value);
      return;
    }

    if (!inView) return;

    const unsubscribe = motionValue.on("change", (latest) => {
      node.textContent = format(latest);
    });

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [inView, reduced, value, duration, format, motionValue]);

  // Rendered with the final value so it is correct before hydration and in any no-JS snapshot.
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
