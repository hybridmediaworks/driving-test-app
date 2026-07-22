import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatCard({
  title,
  value,
  hint,
  delta,
  children,
}: {
  title: string;
  value: number | string;
  hint?: string;
  /** Rendered as a small good-toned badge, e.g. "+96 / 7d". */
  delta?: string;
  /** Optional sparkline / mini-meter rendered under the value. */
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">{title}</CardTitle>
          {delta && (
            <span className="rounded-full bg-status-good-wash px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-status-good">
              {delta}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
