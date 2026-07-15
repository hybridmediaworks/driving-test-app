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
  onPress?: () => void;
};

export function ExamCard({
  title,
  subtitle,
  image,
  progress,
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
          {/* Progress badge */}
          {progress && (
            <View className="absolute bottom-3 self-center bg-black/60 rounded-full px-4 py-1">
              <Text className="text-white text-xs font-semibold">
                {progress}
              </Text>
            </View>
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
