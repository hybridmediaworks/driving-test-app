import { Checkbox } from "@/components/ui/checkbox";
import { Heading } from "@/components/ui/heading";
import { Secondary } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";

export type ProgressItemProps = {
  image: string;
  title: string;
  subtitle: string;
  type: "manual" | "nav";
  checked?: boolean;
  onCheckChange?: (val: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
};

export function ProgressItem({
  image,
  title,
  subtitle,
  type,
  checked,
  onCheckChange,
  onPress,
  isLast,
}: ProgressItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={type === "nav" ? 0.7 : 1}
      onPress={type === "nav" ? onPress : undefined}
      className={`flex-row items-center py-4 border-t border-secondary-200 dark:border-secondary-800 ${
        !isLast ? "border-t border-secondary-200 dark:border-secondary-800" : ""
      }`}
      style={{ gap: 12 }}
    >
      <Image
        source={{ uri: image }}
        style={{ width: 72, height: 72, borderRadius: 12 }}
        contentFit="cover"
      />
      <View style={{ flex: 1 }}>
        <Heading level="h5">{title}</Heading>
        <Text className="text-sm text-secondary-500 dark:text-secondary-400 py-1">
          {subtitle}
        </Text>
        {type === "manual" && (
          <View className="items-start ">
            <Text className="px-4 py-1 rounded-full bg-primary text-white">
              Get it
            </Text>
          </View>
        )}
      </View>
      {type === "nav" && (
        <MaterialIcons name="chevron-right" size={24} color={Secondary[400]} />
      )}
      {type === "manual" && (
        <Checkbox
          checked={!!checked}
          onChange={(val) => onCheckChange?.(val)}
        />
      )}
    </TouchableOpacity>
  );
}
