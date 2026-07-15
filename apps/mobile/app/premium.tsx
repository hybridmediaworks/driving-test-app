import { Heading } from "@/components/ui/heading";
import { Primary, Secondary, White } from "@/constants/theme";
import { useUserStore, type VehicleType } from "@/store/userStore";
import { FontAwesome5 } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GOLD = "#F5A623";

const vehicleTitle: Record<VehicleType, string> = {
  motorcycle: "Ace Your Motorcycle Rider\nDMV Exam",
  car: "Ace Your Car Driver\nDMV Exam",
  truck: "Ace Your CDL Truck\nDriver Exam",
};

const FEATURES = [
  {
    title: "500+ exam-like questions",
    description:
      "Our users swear these questions are nearly identical to the real exam",
  },
  {
    title: "Proprietary, truly state-specific question bank",
    description: "You won't find these questions anywhere else.",
  },
  {
    title: "Instant feedback",
    description: "In-depth explanations help you understand every question",
  },
  {
    title: "2 Printable PDF Cheat Sheets",
    description: "Trickiest questions most people miss.",
  },
];

const SLIDES = [
  "features",
  "testimonials",
  "study-plan",
  "guarantee",
  "pricing",
];

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 14, marginBottom: 20 }}>
      <MaterialIcons
        name="check"
        size={22}
        color={Primary.DEFAULT}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Heading level="h5" color="white" className="mb-1">
          {title}
        </Heading>
        <Text className="text-secondary-400">{description}</Text>
      </View>
    </View>
  );
}

function PassRateBadge() {
  return (
    <View className="items-center my-2">
      <View className="flex-row items-center gap-2">
        <FontAwesome5 name="angle-left" size={60} color={Primary.DEFAULT} />
        <View className="items-center px-2" style={{ alignItems: "center" }}>
          <Heading
            color="white"
            style={{
              fontSize: 44,
              fontWeight: "900",
              lineHeight: 48,
            }}
          >
            97%
          </Heading>
          <Text className="text-white text-base">Pass Rate</Text>
        </View>
        <FontAwesome5 name="angle-right" size={60} color={Primary.DEFAULT} />
      </View>
    </View>
  );
}

export default function PremiumScreen() {
  const router = useRouter();
  const vehicleType = useUserStore((s) => s.vehicleType) ?? "car";
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(index);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Secondary.DEFAULT }}
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />
      {/* Background glow */}
      <View
        style={{
          boxShadow: `${Primary.DEFAULT} 0px 0px 100px 100px`,
          position: "absolute",
          top: 0,
          left: SCREEN_WIDTH / 2 - 5,
          width: 1,
          height: 1,
          borderRadius: 80,
          backgroundColor: Primary.DEFAULT,
          opacity: 0.5,
        }}
      />

      {/* Close button */}
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          top: 56,
          right: 20,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: Secondary[700],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons name="close" size={20} color={White.DEFAULT} />
      </TouchableOpacity>

      {/* Static header — Premium badge, title, subtitle */}
      <View className="px-5 pt-4 items-center">
        <View className="px-5 py-2 border-2 border-primary-400 rounded-full mb-5">
          <Heading level="h4" style={{ color: Primary[400] }}>
            Premium
          </Heading>
        </View>

        <Heading color="white" className="text-center mb-3">
          {vehicleTitle[vehicleType]}
        </Heading>
        <Text className="text-base text-secondary-400">
          Get all exam-like questions and pass the first time
        </Text>
      </View>

      {/* Slide pager — only feature content scrolls */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={() => (
          <ScrollView
            style={{ width: SCREEN_WIDTH }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 8,
            }}
            showsVerticalScrollIndicator={false}
          >
            {FEATURES.map((f) => (
              <FeatureItem
                key={f.title}
                title={f.title}
                description={f.description}
              />
            ))}
            <PassRateBadge />
            {/* Pagination dots */}
            <View className="flex-row py-4 justify-center gap-2 mt-6">
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === activeSlide ? 10 : 8,
                    height: i === activeSlide ? 10 : 8,
                    borderRadius: 5,
                    backgroundColor:
                      i === activeSlide ? White.DEFAULT : Secondary[500],
                  }}
                />
              ))}
            </View>
          </ScrollView>
        )}
      />

      {/* Bottom CTA */}
      <View className="px-4 pb-3 pt-1">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => console.log("get lifetime access")}
          style={{
            backgroundColor: GOLD,
            borderRadius: 32,
            paddingVertical: 18,
            alignItems: "center",
          }}
        >
          <Text className="text-secondary text-lg font-extrabold">
            Get Lifetime Access: $39.00
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
          }}
        >
          <TouchableOpacity onPress={() => console.log("terms")}>
            <Text className="text-sm text-secondary-400">Terms</Text>
          </TouchableOpacity>
          <Text className="text-sm text-secondary-400">&</Text>
          <TouchableOpacity onPress={() => console.log("privacy")}>
            <Text className="text-sm text-secondary-400">Privacy</Text>
          </TouchableOpacity>
          <Text className="text-sm text-secondary-400">|</Text>
          <TouchableOpacity onPress={() => console.log("restore")}>
            <Text className="text-sm text-secondary-400">Restore purchase</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
