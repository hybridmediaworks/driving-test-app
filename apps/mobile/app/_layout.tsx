import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export const unstable_settings = {
  anchor: 'onboarding',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const preference = useThemeStore((s) => s.preference);
  const isDark = preference === 'dark';
  const { setColorScheme } = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  useEffect(() => {
    setColorScheme(preference);
  }, [preference]);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1">
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
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
