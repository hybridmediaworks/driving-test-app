import { Heading } from "@/components/ui/heading";
import {
  ImageBackground,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type HeroCardProps = {
  title: string;
  description: string;
  image: ImageSourcePropType;
  onPress?: () => void;
};

export function HeroCard({
  title,
  description,
  image,
  onPress,
}: HeroCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="mx-4 rounded-2xl overflow-hidden"
    >
      <ImageBackground
        source={image}
        style={{ height: 420 }}
        resizeMode="cover"
      >
        {/* Dark gradient overlay */}
        <View className="flex-1 bg-black/30 justify-between p-4">
          {/* Badge */}
          <View>
            <Text className="text-xs font-semibold text-white tracking-widest uppercase">
              Take Me Next
            </Text>
            <Heading level="h2" weight="semibold" color="white">
              {title}
            </Heading>
          </View>
          <Text className="text-white text-base leading-5">{description}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}
