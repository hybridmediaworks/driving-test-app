import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-5 py-3 text-base gap-2",
  lg: "px-6 py-4 text-base gap-2.5",
};

const iconSizeClasses: Record<Size, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-xs",
  secondary: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
  outline: "border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50",
  ghost: "text-blue-500 bg-transparent",
};

type ButtonProps = {
  text?: string;
  icon?: ComponentType<{ className?: string }>;
  variant?: Variant;
  size?: Size;
  iconPosition?: "left" | "right";
  href?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function Button({
  text,
  icon: Icon,
  variant = "primary",
  size = "lg",
  iconPosition = "left",
  href,
  className = "",
  children,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const classes = [
    "inline-flex cursor-pointer items-center justify-center rounded-full font-semibold transition-opacity hover:opacity-90",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {Icon && iconPosition === "left" && <Icon className={iconSizeClasses[size]} />}
      {text ? <span>{text}</span> : children}
      {Icon && iconPosition === "right" && <Icon className={iconSizeClasses[size]} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
