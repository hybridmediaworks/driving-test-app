import { Primary, Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, TouchableOpacity, View } from "react-native";

type TheoryCardProps = {
  title: string;
  description?: string;
  fileInfo?: string;
  locked?: boolean;
  onPress?: () => void;
};

export function TheoryCard({
  title,
  description,
  fileInfo,
  locked = false,
  onPress,
}: TheoryCardProps) {
  const isDark = useIsDark();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="bg-secondary-100 dark:bg-secondary-800 rounded-2xl p-4"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 flex-1 mr-2">
          {title}
        </Text>
        {locked && (
          <MaterialIcons
            name="lock"
            size={20}
            color={isDark ? Secondary[500] : Secondary[400]}
          />
        )}
      </View>

      {description && (
        <Text className="text-sm text-secondary-500 dark:text-secondary-400 mb-3">
          {description}
        </Text>
      )}

      <View className="flex-row items-center gap-3">
        {!locked && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            className="px-4 py-1.5 rounded-full"
            style={{ backgroundColor: Primary.DEFAULT }}
          >
            <Text className="text-white text-sm font-semibold">Get it</Text>
          </TouchableOpacity>
        )}
        {fileInfo && (
          <Text className="text-sm text-secondary-400 dark:text-secondary-500">
            {fileInfo}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
