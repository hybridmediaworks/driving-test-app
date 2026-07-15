import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { CheckboxCard } from "@/components/ui/checkbox-card";
import { useUserStore } from "@/store/userStore";

const reminderOptions = [
  { id: "new-questions", label: "Practice new questions" },
  { id: "mistakes", label: "Practice mistakes (Challenge Bank!\u2122)" },
  { id: "simulator", label: "Practice Exam Simulator" },
];

export default function RemindersScreen() {
  const setReminderPreferences = useUserStore((s) => s.setReminderPreferences);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const [checked, setChecked] = useState<string[]>(
    reminderOptions.map((o) => o.id)
  );

  function toggle(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function finish() {
    setReminderPreferences(checked);
    completeOnboarding();
    router.replace("/(tabs)");
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
          Ready to turn on daily practice reminders?
        </Text>

        <View className="mt-8 gap-3">
          {reminderOptions.map((option) => (
            <CheckboxCard
              key={option.id}
              id={option.id}
              label={option.label}
              checked={checked.includes(option.id)}
              onToggle={toggle}
            />
          ))}
        </View>
      </ScrollView>

      <View className="px-5 pb-4 gap-3">
        <Button showArrow onPress={finish}>Yes, I'm ready</Button>

        <TouchableOpacity onPress={finish} activeOpacity={0.7} className="items-center py-2">
          <Text className="text-primary text-base font-semibold">
            No, maybe later
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
