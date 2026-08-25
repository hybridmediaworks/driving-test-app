import { Secondary } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ImageBackground,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ExamCardProps = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  progress?: string;
  locked?: boolean;
  onPress?: () => void;
};

export function ExamCard({
  title,
  subtitle,
  image,
  progress,
  locked = false,
  onPress,
}: ExamCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="mx-4 mb-6  overflow-hidden"
    >
      {/* Image */}
      <View className="h-48 rounded-2xl overflow-hidden">
        <ImageBackground source={image} style={{ flex: 1 }} resizeMode="cover">
          {locked ? (
            <View className="flex-1 bg-black/20 items-center justify-center">
              <View className="bg-white/90 w-9 h-9 rounded-full items-center justify-center">
                <MaterialIcons name="lock" size={18} color={Secondary[700]} />
              </View>
            </View>
          ) : (
            progress && (
              <View className="absolute bottom-3 self-center bg-black/60 rounded-full px-4 py-1">
                <Text className="text-white text-xs font-semibold">
                  {progress}
                </Text>
              </View>
            )
          )}
        </ImageBackground>
      </View>

      {/* Info */}
      <View className="py-3">
        <Text className="text-base font-bold text-secondary-900 dark:text-secondary-50">{title}</Text>
        <Text className="text-sm text-secondary-500 dark:text-secondary-400 mt-0.5">{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}
