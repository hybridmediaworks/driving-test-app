import { Text, type TextProps } from "react-native";

type Level = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type Color =
  | "default"
  | "primary"
  | "secondary"
  | "muted"
  | "error"
  | "success"
  | "warning"
  | "white";

type Weight =
  | "thin"
  | "extralight"
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold"
  | "black";

type HeadingProps = TextProps & {
  level?: Level;
  color?: Color;
  weight?: Weight;
  children: React.ReactNode;
};

const levelSize: Record<Level, string> = {
  h1: "text-4xl",
  h2: "text-3xl",
  h3: "text-2xl",
  h4: "text-xl",
  h5: "text-lg",
  h6: "text-base",
};

const levelDefaultWeight: Record<Level, Weight> = {
  h1: "bold",
  h2: "bold",
  h3: "semibold",
  h4: "semibold",
  h5: "semibold",
  h6: "semibold",
};

// Color tokens
const colorStyles: Record<Color, string> = {
  default: "text-secondary-900 dark:text-secondary-50",
  primary: "text-primary dark:text-primary-400",
  secondary: "text-secondary-500 dark:text-secondary-400",
  muted: "text-secondary-400 dark:text-secondary-500",
  error: "text-error",
  success: "text-success",
  warning: "text-warning",
  white: "text-white",
};

// Weight overrides — applied on top of the level default
const weightStyles: Record<Weight, string> = {
  thin: "font-thin",
  extralight: "font-extralight",
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
  black: "font-black",
};

export function Heading({
  level = "h1",
  color = "default",
  weight,
  children,
  className = "",
  ...rest
}: HeadingProps) {
  const resolvedWeight = weight ?? levelDefaultWeight[level];

  return (
    <Text
      className={`${levelSize[level]} ${weightStyles[resolvedWeight]} ${colorStyles[color]} ${className}`}
      {...rest}
    >
      {children}
    </Text>
  );
}
