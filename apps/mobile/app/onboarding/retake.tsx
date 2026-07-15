import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SelectionCard } from "@/components/ui/selection-card";
import { type RetakeStatus, useUserStore } from "@/store/userStore";

const options = [
  { id: "first", title: "First try" },
  { id: "retake", title: "Retake" },
];

export default function RetakeScreen() {
  const setIsRetake = useUserStore((s) => s.setIsRetake);
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    setIsRetake(selected as RetakeStatus);
    router.push("/onboarding/exam-date");
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
          Is this your first try or a retake?
        </Text>
        <Text className="text-secondary-400 text-center mt-3 text-base">
          No shame - just smarter prep.
        </Text>

        <View className="mt-8 gap-3">
          {options.map((option) => (
            <SelectionCard
              key={option.id}
              id={option.id}
              title={option.title}
              selected={selected === option.id}
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
