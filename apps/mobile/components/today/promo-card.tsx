import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Heading } from "../ui/heading";

type PromoCardProps = {
  title: string;
  subtitle: string;
  previewImage?: ImageSourcePropType;
  onPress?: () => void;
};

export function PromoCard({
  title,
  subtitle,
  previewImage,
  onPress,
}: PromoCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="mx-4 mb-6 rounded-2xl overflow-hidden bg-primary"
    >
      <View className="flex-row items-center justify-between p-6">
        {/* Left content */}
        <View className="pr-6">
          {/* Star icon */}
          <View className="w-10 h-10 rounded-full items-center justify-center mb-3 bg-white">
            <MaterialIcons name="star" size={22} className="text-primary" />
          </View>
          <Heading level="h3" weight="semibold" color="white" className="mb-1">
            {title}
          </Heading>
          <Text className="text-white/70 text-base leading-5">{subtitle}</Text>
        </View>

        {/* Right preview image */}
        {previewImage && (
          <View className="w-36 h-40 border-2 rounded-xl overflow-hidden">
            <Image
              source={previewImage}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
