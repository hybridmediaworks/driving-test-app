import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

type ScreenHeaderProps = {
  title?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, rightElement }: ScreenHeaderProps) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View className="flex-row items-center px-5 pt-2 pb-3">
      {/* Back button */}
      <TouchableOpacity
        onPress={handleBack}
        activeOpacity={0.7}
        className="w-9 h-9 items-center justify-center"
      >
        <Text className="text-3xl text-secondary dark:text-secondary-50 leading-none">
          {"‹"}
        </Text>
      </TouchableOpacity>

      {/* Title */}
      <Text className="flex-1 text-center text-base font-semibold text-secondary dark:text-secondary-50">
        {title ?? ""}
      </Text>

      {/* Right slot — keeps title centred */}
      <View className="w-9 h-9 items-center justify-center">
        {rightElement ?? null}
      </View>
    </View>
  );
}
