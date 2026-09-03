import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";

export default function TabLayout() {
  const isDark = useIsDark();
  const theme = isDark ? "dark" : "light";
  // Add the bottom safe-area inset so the tab bar clears the Android 3-button nav bar / iOS home
  // indicator instead of being cut off by it (the app runs edge-to-edge on Android).
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 64 + insets.bottom,
          // Equal breathing room above the icons and below the labels. The safe-area inset (Android
          // nav bar / iOS home indicator) is added on top of the same 8px used at the top, so the
          // icons/labels sit symmetrically inside the bar rather than hugging the bottom.
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          backgroundColor: Colors[theme].tabBackground,
          borderTopColor: Colors[theme].tabBorder,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarInactiveTintColor: Colors[theme].tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="challange-bank"
        options={{
          title: "Quiz Vault",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="folder.badge.questionmark"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
