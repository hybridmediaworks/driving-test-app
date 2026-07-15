import { Primary, Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  type TouchableOpacityProps,
} from "react-native";

type Variant = "primary" | "outline" | "ghost" | "secondary-outline" | "secondary";
type Size = "sm" | "md" | "lg";

type ButtonProps = TouchableOpacityProps & {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  showArrow?: boolean;
  children: React.ReactNode;
};

const container: Record<Variant, string> = {
  primary: "bg-primary rounded-full flex-row items-center justify-center gap-2",
  outline:
    "border border-primary rounded-full flex-row items-center justify-center gap-2 bg-transparent",
  ghost:
    "rounded-full flex-row items-center justify-center gap-2 bg-transparent",
  "secondary-outline":
    "border border-secondary-300 dark:border-secondary-600 rounded-full flex-row items-center justify-center gap-2 bg-transparent",
  secondary:
    "bg-secondary-200 dark:bg-secondary-700 rounded-full flex-row items-center justify-center gap-2",
};

const labelStyle: Record<Variant, string> = {
  primary: "text-white font-semibold",
  outline: "text-primary font-semibold",
  ghost: "text-primary font-semibold",
  "secondary-outline":
    "text-secondary-600 dark:text-secondary-300 font-semibold",
  secondary: "text-secondary-800 dark:text-secondary-100 font-semibold",
};

const iconColor: Record<Variant, string> = {
  primary: White.DEFAULT,
  outline: Primary.DEFAULT,
  ghost: Primary.DEFAULT,
  "secondary-outline": Secondary[600],
  secondary: Secondary[800],
};

const containerPadding: Record<Size, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-3",
  lg: "px-6 py-4",
};

const labelSize: Record<Size, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

const arrowSize: Record<Size, number> = {
  sm: 16,
  md: 22,
  lg: 26,
};

const disabledContainer =
  "bg-secondary-200 dark:bg-secondary-700 rounded-full flex-row items-center justify-center gap-2";
const disabledLabelStyle =
  "text-secondary-400 dark:text-secondary-500 font-semibold";
const disabledIconColor = Secondary[400];

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  showArrow = false,
  onPress,
  className,
  ...rest
}: ButtonProps) {
  const isDark = useIsDark();
  const isDisabled = disabled;
  const baseStyle = isDisabled
    ? `${disabledContainer} ${containerPadding[size]}`
    : `${container[variant]} ${containerPadding[size]}`;
  const textStyle = isDisabled
    ? `${disabledLabelStyle} ${labelSize[size]}`
    : `${labelStyle[variant]} ${labelSize[size]}`;
  const currentIconColor = isDisabled
    ? disabledIconColor
    : variant === "secondary-outline"
      ? isDark
        ? Secondary[300]
        : Secondary[600]
      : iconColor[variant];

  return (
    <TouchableOpacity
      activeOpacity={isDisabled ? 1 : 0.85}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      className={className ? `${baseStyle} ${className}` : baseStyle}
      {...rest}
    >
      <View className="flex-row items-center gap-2">
        {React.Children.map(children, (child) =>
          typeof child === "string" ? (
            <Text numberOfLines={1} className={textStyle}>
              {child}
            </Text>
          ) : React.isValidElement(child) ? (
            React.cloneElement(child as React.ReactElement<any>, {
              color: currentIconColor,
            })
          ) : (
            child
          ),
        )}
      </View>

      {showArrow && (
        <View className="ml-1">
          <MaterialIcons
            name="chevron-right"
            size={arrowSize[size]}
            color={currentIconColor}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}
