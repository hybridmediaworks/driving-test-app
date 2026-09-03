import { Primary, Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, TouchableOpacity, View } from "react-native";
import { Button } from "../ui/button";

type ActionType = "get" | "unlock";

type TheoryItemProps = {
  title: string;
  icon: "cloud-download" | "lock";
  action: ActionType;
  onPress?: () => void;
  /** Shows a spinner on the "Read" button while the cheat sheet PDF is opening. */
  loading?: boolean;
};

const iconMap: Record<
  TheoryItemProps["icon"],
  React.ComponentProps<typeof MaterialIcons>["name"]
> = {
  "cloud-download": "cloud-download",
  lock: "lock",
};

export function TheoryItem({ title, icon, action, onPress, loading = false }: TheoryItemProps) {
  const isDark = useIsDark();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={loading ? undefined : onPress}
      disabled={loading}
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
        <Button variant="primary" size="sm" loading={loading} onPress={onPress}>
          Read
        </Button>
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
