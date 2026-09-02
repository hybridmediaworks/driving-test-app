import { Button } from "@/components/ui/button";
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
  // Manual only — the "Get it" CTA that opens the driver's handbook, and its loading state.
  onGet?: () => void;
  getLoading?: boolean;
  // Premium/locked nav row — shows a lock icon instead of the chevron.
  locked?: boolean;
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
  onGet,
  getLoading,
  locked = false,
  isLast,
}: ProgressItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={type === "manual" ? 1 : 0.7}
      onPress={
        type === "nav"
          ? onPress
          : type === "manual"
            ? () => onCheckChange?.(!checked)
            : undefined
      }
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
          <View className="items-start">
            <Button variant="primary" size="sm" loading={getLoading} onPress={onGet}>
              Get it
            </Button>
          </View>
        )}
      </View>
      {type === "nav" && (
        <MaterialIcons
          name={locked ? "lock" : "chevron-right"}
          size={locked ? 20 : 24}
          color={Secondary[400]}
        />
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
