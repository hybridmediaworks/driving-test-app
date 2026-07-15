import { createElement, type ReactNode } from "react";

type Size = "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type Tag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const defaultSizeByTag: Record<Tag, Size> = {
  h1: "2xl",
  h2: "xl",
  h3: "lg",
  h4: "md",
  h5: "sm",
  h6: "xs",
};

const sizeClasses: Record<Size, string> = {
  "2xl": "text-[40px] leading-tight md:text-[50px] md:leading-snug lg:text-[64px] lg:leading-18",
  xl: "text-[36px] leading-tight md:text-[44px] md:leading-snug lg:text-[56px] lg:leading-16",
  lg: "text-[32px] leading-tight md:text-[40px] md:leading-snug lg:text-5xl lg:leading-15",
  md: "text-[28px] leading-tight md:text-[34px] md:leading-snug lg:text-[40px] lg:leading-10.5",
  sm: "text-[26px] leading-tight md:text-[30px] md:leading-snug lg:text-4xl lg:leading-11",
  xs: "text-[22px] leading-tight md:text-[26px] md:leading-snug lg:text-3xl lg:leading-9.5",
  "2xs": "text-[20px] leading-tight md:text-[22px] md:leading-snug lg:text-2xl lg:leading-8",
};

const colorClasses = {
  default: "text-neutral-900",
  primary: "text-blue-500",
  muted: "text-gray-500",
  white: "text-white",
};

type HeadingProps = {
  as?: Tag;
  size?: Size;
  color?: keyof typeof colorClasses;
  gradient?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Heading({
  as = "h2",
  size,
  color = "default",
  gradient = false,
  className = "",
  children,
}: HeadingProps) {
  const activeSize = size ?? defaultSizeByTag[as];

  const classes = [
    "font-sora font-semibold tracking-tight",
    sizeClasses[activeSize],
    gradient ? "bg-linear-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent" : colorClasses[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createElement(as, { className: classes }, children);
}
