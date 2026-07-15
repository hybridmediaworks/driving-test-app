import { Secondary, Success, Warning } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ImageBackground,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TestCardProps = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  locked?: boolean;
  showContinue?: boolean;
  gridStyle?: boolean;
  result?: "passed" | "failed";
  onPress?: () => void;
};

export function TestCard({
  title,
  subtitle,
  image,
  locked = false,
  showContinue = false,
  result,
  onPress,
  gridStyle,
}: TestCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className={`${gridStyle ? "w-full" : "w-48 mr-3"} rounded-2xl overflow-hidden`}
    >
      {/* Image with optional lock overlay */}
      <View className="h-48 overflow-hidden rounded-2xl">
        <ImageBackground source={image} style={{ flex: 1 }} resizeMode="cover">
          {locked ? (
            <View className="flex-1 bg-black/20 items-center justify-center">
              <View className="bg-white/90 w-9 h-9 rounded-full items-center justify-center">
                <MaterialIcons name="lock" size={18} color={Secondary[700]} />
              </View>
            </View>
          ) : result ? (
            <View className="flex-1 bg-black/20 items-center justify-center">
              <View className="bg-white/90 w-9 h-9 rounded-full items-center justify-center">
                {result === "passed" ? (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={Success.DEFAULT}
                  />
                ) : (
                  <MaterialIcons
                    name="priority-high"
                    size={20}
                    color={Warning.DEFAULT}
                  />
                )}
              </View>
            </View>
          ) : showContinue ? (
            <View className="flex-1 justify-end p-2">
              <View className="self-start bg-primary px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">
                  Continue
                </Text>
              </View>
            </View>
          ) : null}
        </ImageBackground>
      </View>

      {/* Info */}
      <View className="py-2">
        <Text
          className="text-base font-semibold text-secondary-900 dark:text-secondary-50"
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text className="text-sm text-secondary-500 dark:text-secondary-400 mt-0.5">
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
