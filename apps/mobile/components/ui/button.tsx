import { Primary, Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  type TouchableOpacityProps,
  type ViewStyle,
} from "react-native";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "secondary-outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = TouchableOpacityProps & {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  showArrow?: boolean;
  children: React.ReactNode;
};

const container: Record<Exclude<Variant, "primary">, string> = {
  secondary:
    "bg-primary-50 dark:bg-primary-900 rounded-full flex-row items-center justify-center gap-2",
  outline:
    "border border-secondary-200 dark:border-secondary-700 rounded-full flex-row items-center justify-center gap-2 bg-transparent",
  ghost:
    "rounded-full flex-row items-center justify-center gap-2 bg-transparent",
  "secondary-outline":
    "border border-secondary-300 dark:border-secondary-600 rounded-full flex-row items-center justify-center gap-2 bg-transparent",
};

const labelStyle: Record<Variant, string> = {
  primary: "text-white font-sans-semibold",
  secondary: "text-primary-700 dark:text-primary-200 font-sans-semibold",
  outline: "text-secondary-900 dark:text-secondary-50 font-sans-semibold",
  ghost: "text-primary font-sans-semibold",
  "secondary-outline":
    "text-secondary-600 dark:text-secondary-300 font-sans-semibold",
};

const iconColor: Record<Variant, string> = {
  primary: White.DEFAULT,
  secondary: Primary[700],
  outline: Secondary[900],
  ghost: Primary.DEFAULT,
  "secondary-outline": Secondary[600],
};

const gradientColors: [string, string] = ["#3B82F6", "#1D4ED8"];

const containerPadding: Record<Size, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-3",
  lg: "px-6 py-4",
};

const gradientPadding: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 12, paddingVertical: 6 },
  md: { paddingHorizontal: 16, paddingVertical: 12 },
  lg: { paddingHorizontal: 24, paddingVertical: 16 },
};

const gradientLayoutStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
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
  "text-secondary-400 dark:text-secondary-500 font-sans-semibold";
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
  const isGradientPrimary = variant === "primary" && !isDisabled;
  const baseStyle = isDisabled
    ? `${disabledContainer} ${containerPadding[size]}`
    : isGradientPrimary
      ? ""
      : `${container[variant as Exclude<Variant, "primary">]} ${containerPadding[size]}`;
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

  const content = (
    <>
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
    </>
  );

  return (
    <TouchableOpacity
      activeOpacity={isDisabled ? 1 : 0.85}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      className={
        isGradientPrimary
          ? className
            ? `rounded-full overflow-hidden ${className}`
            : "rounded-full overflow-hidden"
          : className
            ? `${baseStyle} ${className}`
            : baseStyle
      }
      {...rest}
    >
      {isGradientPrimary ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[gradientLayoutStyle, gradientPadding[size]]}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
}
