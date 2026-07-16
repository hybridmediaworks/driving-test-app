import type { ReactNode } from "react";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type Color = "default" | "dark" | "muted" | "primary" | "white";

const sizeClasses: Record<Size, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base leading-6",
  lg: "text-lg",
  xl: "text-xl leading-7.5",
  "2xl": "md:text-2xl md:leading-8 text-xl leading-7",
};

const colorClasses: Record<Color, string> = {
  default: "text-neutral-700",
  dark: "text-neutral-900",
  muted: "text-neutral-500",
  primary: "text-blue-700",
  white: "text-white",
};

type ParagraphProps = {
  size?: Size;
  color?: Color;
  className?: string;
  children: ReactNode;
};

export default function Paragraph({
  size = "md",
  color = "default",
  className = "",
  children,
}: ParagraphProps) {
  const classes = [
    "leading-relaxed",
    sizeClasses[size],
    colorClasses[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <p className={classes}>{children}</p>;
}
