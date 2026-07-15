import { Primary, Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, TouchableOpacity, View } from "react-native";

type ActionType = "get" | "unlock";

type TheoryItemProps = {
  title: string;
  icon: "cloud-download" | "lock";
  action: ActionType;
  onPress?: () => void;
};

const iconMap: Record<
  TheoryItemProps["icon"],
  React.ComponentProps<typeof MaterialIcons>["name"]
> = {
  "cloud-download": "cloud-download",
  lock: "lock",
};

export function TheoryItem({ title, icon, action, onPress }: TheoryItemProps) {
  const isDark = useIsDark();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="flex-row items-center px-4 py-4 border-b border-secondary-100 dark:border-secondary-700"
    >
      {/* Icon */}
      <View className="w-9 h-9 items-center justify-center mr-3">
        <MaterialIcons
          name={iconMap[icon]}
          size={22}
          color={
            icon === "cloud-download"
              ? Primary.DEFAULT
              : isDark
                ? Secondary[500]
                : Secondary[400]
          }
        />
      </View>

      {/* Title */}
      <Text className="flex-1 text-base font-medium text-secondary-900 dark:text-secondary-50">
        {title}
      </Text>

      {/* Action */}
      {action === "get" ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          className="px-4 py-1.5 rounded-full"
          style={{ backgroundColor: Primary.DEFAULT }}
        >
          <Text className="text-white text-sm font-semibold">Get it</Text>
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center">
          <Text className="text-sm text-secondary-400 dark:text-secondary-500 font-medium">
            Unlock
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={18}
            color={isDark ? Secondary[500] : Secondary[400]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}
