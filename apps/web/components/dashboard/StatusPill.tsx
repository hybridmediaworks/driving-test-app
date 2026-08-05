import { AlertTriangle, CheckCircle2, Circle, XCircle } from "lucide-react";

const TONES = {
  good: { icon: CheckCircle2, bg: "bg-status-good-wash", iconColor: "text-status-good" },
  warning: { icon: AlertTriangle, bg: "bg-status-warning-wash", iconColor: "text-status-warning" },
  critical: { icon: XCircle, bg: "bg-status-critical-wash", iconColor: "text-status-critical" },
  neutral: { icon: Circle, bg: "bg-border", iconColor: "text-muted-foreground" },
} as const;

/**
 * A status pill never carries meaning through color alone — the icon does, the text stays
 * neutral ink, per the dataviz skill's "text never wears the data color" rule.
 */
export default function StatusPill({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  const { icon: Icon, bg, iconColor } = TONES[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${bg}`}>
      <Icon className={`size-3 ${iconColor}`} />
      {children}
    </span>
  );
}
