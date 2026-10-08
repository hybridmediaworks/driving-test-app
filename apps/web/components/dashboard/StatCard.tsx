"use client";

import type { ReactNode } from "react";
import * as motion from "motion/react-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnimatedNumber from "./AnimatedNumber";

export default function StatCard({
  title,
  value,
  hint,
  delta,
  children,
}: {
  title: string;
  /** A number counts up on first view; a string is printed as given. */
  value: number | string;
  hint?: string;
  /** Rendered as a small good-toned badge, e.g. "+96 / 7d". */
  delta?: string;
  /** Optional sparkline / mini-meter rendered under the value. */
  children?: ReactNode;
}) {
  return (
    <motion.div
      // The lift is small on purpose: enough to say "this is a surface", not enough to make a
      // grid of four cards feel like it is breathing at you.
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className="h-full"
    >
      <Card className="h-full transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(16,24,40,0.35)]">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {title}
            </CardTitle>
            {delta && (
              <span className="rounded-full bg-status-good-wash px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-status-good">
                {delta}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-semibold tabular-nums">
            {typeof value === "number" ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
