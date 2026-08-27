import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SelectionCard } from "@/components/ui/selection-card";
import { useReferenceDataStore } from "@/store/referenceDataStore";
import { type VehicleType, useUserStore } from "@/store/userStore";

// The vehicle-types API only returns id/name/title — emoji and marketing copy for the three
// known categories stay client-side (per doc/API_REQUIREMENTS.md §8).
const VEHICLE_META: Record<string, { emoji: string; description: string }> = {
  car: { emoji: "🚗", description: "Learner's permit or driver's license" },
  cdl: {
    emoji: "🚛",
    description: "Commercial driver's license or learner's permit (CLP)",
  },
  motorcycle: {
    emoji: "🏍️",
    description: "Motorcycle rider's license or learner's permit",
  },
};

export default function VehicleScreen() {
  const setVehicleType = useUserStore((s) => s.setVehicleType);
  const currentVehicle = useUserStore((s) => s.vehicleType);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [selected, setSelected] = useState<string | null>(currentVehicle);

  const vehicleTypes = useReferenceDataStore((s) => s.vehicleTypes);
  const loading = useReferenceDataStore((s) => s.vehicleTypesLoading);
  const error = useReferenceDataStore((s) => s.vehicleTypesError);
  const fetchVehicleTypes = useReferenceDataStore((s) => s.fetchVehicleTypes);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

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

        {loading && vehicleTypes.length === 0 ? (
          <ActivityIndicator className="mt-10" />
        ) : error && vehicleTypes.length === 0 ? (
          <Text className="text-center text-red-500 mt-10">{error}</Text>
        ) : (
          <View className="mt-8 gap-3">
            {vehicleTypes.map((vehicle) => (
              <SelectionCard
                key={vehicle.id}
                id={vehicle.name}
                title={vehicle.title}
                emoji={VEHICLE_META[vehicle.name]?.emoji}
                description={VEHICLE_META[vehicle.name]?.description}
                selected={selected === vehicle.name}
                onSelect={setSelected}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View className="px-5 pb-8">
        <Button showArrow disabled={!selected} onPress={handleNext}>
          Next
        </Button>
      </View>
    </SafeAreaView>
  );
}
