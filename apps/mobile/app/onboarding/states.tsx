import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SelectionCard } from "@/components/ui/selection-card";
import { US_STATES } from "@/constants/us-states";
import { useUserStore } from "@/store/userStore";

export default function StatesScreen() {
  const setStateStore = useUserStore((s) => s.setState);
  const currentState = useUserStore((s) => s.state);
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [selected, setSelected] = useState<string | null>(currentState);
  const [query, setQuery] = useState("");

  function handleNext() {
    setStateStore(selected!);
    if (from === "settings") {
      router.back();
    } else {
      router.push("/onboarding/retake");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return US_STATES;
    return US_STATES.filter((s) => s.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900">
      <ScreenHeader />

      <View className="px-5">
        <Text className="text-4xl font-bold text-secondary dark:text-secondary-50 mt-4 text-center leading-tight">
          Which state are you in?
        </Text>
        <Text className="text-secondary-400 text-center mt-3 text-base">
          We'll show you the official questions for your state's DMV test.
        </Text>

        <View className="mt-5">
          <Input
            placeholder="Search state..."
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 mt-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
      >
        {filtered.length === 0 ? (
          <Text className="text-center text-secondary-400 mt-6">
            No state found for "{query}"
          </Text>
        ) : (
          filtered.map((state) => (
            <SelectionCard
              key={state.id}
              id={state.id}
              title={state.title}
              selected={selected === state.id}
              onSelect={setSelected}
            />
          ))
        )}
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
