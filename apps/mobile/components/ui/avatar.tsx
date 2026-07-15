import { View, Text } from "react-native";

type Size = "sm" | "md" | "lg";

type AvatarProps = {
  emoji: string;
  size?: Size;
};

const sizeStyles: Record<Size, { container: string; fontSize: number }> = {
  sm: { container: "w-10 h-10", fontSize: 20 },
  md: { container: "w-16 h-16", fontSize: 32 },
  lg: { container: "w-20 h-20", fontSize: 42 },
};

export function Avatar({ emoji, size = "md" }: AvatarProps) {
  const { container, fontSize } = sizeStyles[size];

  return (
    <View className={`${container} rounded-full bg-primary-100 items-center justify-center`}>
      <Text style={{ fontSize }}>{emoji}</Text>
    </View>
  );
}
