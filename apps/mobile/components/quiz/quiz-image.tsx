import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { ImageZoomViewer } from "./image-zoom-viewer";

type Props = {
  uri: string;
  height?: number;
};

// Quiz question image with a tap-to-zoom affordance. Shows a magnifier badge so the zoom is
// discoverable, and opens a fullscreen pinch/pan viewer on tap.
export function QuizImage({ uri, height = 220 }: Props) {
  const [zoomVisible, setZoomVisible] = useState(false);

  return (
    <View className="mb-6 overflow-hidden rounded-2xl border border-secondary-100 dark:border-secondary-800">
      <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomVisible(true)}>
        <Image source={{ uri }} style={{ width: "100%", height }} resizeMode="cover" />
        <View className="absolute bottom-2 right-2 h-8 w-8 items-center justify-center rounded-full bg-black/55">
          <MaterialIcons name="zoom-in" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

      <ImageZoomViewer visible={zoomVisible} uri={uri} onClose={() => setZoomVisible(false)} />
    </View>
  );
}
