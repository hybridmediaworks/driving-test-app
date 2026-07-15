import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useThemeStore } from '@/store/themeStore';

export const unstable_settings = {
  anchor: 'onboarding',
};

export default function RootLayout() {
  const preference = useThemeStore((s) => s.preference);
  const isDark = preference === 'dark';
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(preference);
  }, [preference]);

  return (
    <View className="flex-1">
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="test/see-all" options={{ headerShown: false }} />
          <Stack.Screen name="theory/see-all" options={{ headerShown: false }} />
          <Stack.Screen name="test/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="test/quiz/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="test/results/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="test/review/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="premium" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="challange-bank/review" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </View>
  );
}
