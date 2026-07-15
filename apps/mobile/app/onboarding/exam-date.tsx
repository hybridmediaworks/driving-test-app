import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SelectionCard } from "@/components/ui/selection-card";
import { type ExamDateRange, useUserStore } from "@/store/userStore";

const options = [
  { id: "0-3", title: "0–3 days" },
  { id: "4-7", title: "4–7 days" },
  { id: "8-14", title: "8–14 days" },
  { id: "15+", title: "15+ days / I haven't scheduled it yet" },
];

export default function ExamDateScreen() {
  const setExamDateRange = useUserStore((s) => s.setExamDateRange);
  const currentExamDate = useUserStore((s) => s.examDateRange);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [selected, setSelected] = useState<string | null>(currentExamDate);

  function handleNext() {
    setExamDateRange(selected as ExamDateRange);
    if (from === "settings") {
      router.back();
    } else {
      router.push("/onboarding/reminders");
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
          When is your exam?
        </Text>
        <Text className="text-secondary-400 text-center mt-3 text-base">
          Select how many days are left before your DMV exam, and we'll build your study plan.
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
