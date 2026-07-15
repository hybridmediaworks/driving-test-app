import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SelectionCard } from "@/components/ui/selection-card";
import { type VehicleType, useUserStore } from "@/store/userStore";

const vehicles = [
  {
    id: "car",
    emoji: "🚗",
    title: "Car",
    description: "Learner's permit or driver's license",
  },
  {
    id: "truck",
    emoji: "🚛",
    title: "Truck (CDL)",
    description: "Commercial driver's license or learner's permit (CLP)",
  },
  {
    id: "motorcycle",
    emoji: "🏍️",
    title: "Motorcycle",
    description: "Motorcycle rider's license or learner's permit",
  },
];

export default function VehicleScreen() {
  const setVehicleType = useUserStore((s) => s.setVehicleType);
  const currentVehicle = useUserStore((s) => s.vehicleType);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [selected, setSelected] = useState<string | null>(currentVehicle);

  function handleNext() {
    setVehicleType(selected as VehicleType);
    if (from === "settings") {
      router.back();
    } else {
      router.push("/onboarding/states");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900">
      <ScreenHeader />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Text className="text-4xl font-bold text-secondary dark:text-secondary-50 mt-4 text-center leading-tight">
          Which vehicle will you drive?
        </Text>
        <Text className="text-secondary-400 text-center mt-3 text-base">
          We'll customize your practice for your vehicle type
        </Text>

        <View className="mt-8 gap-3">
          {vehicles.map((vehicle) => (
            <SelectionCard
              key={vehicle.id}
              {...vehicle}
              selected={selected === vehicle.id}
              onSelect={setSelected}
            />
          ))}
        </View>
      </ScrollView>

      <View className="px-5 pb-8">
        <Button
          showArrow
          disabled={!selected}
          onPress={handleNext}
        >Next</Button>
      </View>
    </SafeAreaView>
  );
}
