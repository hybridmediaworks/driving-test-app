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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { Toast } from '@/components/ui/toast';
import * as Purchases from '@/services/purchases';
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

  // Tie RevenueCat purchases to the backend user id (its webhook maps back via `app_user_id`).
  // No-ops in Expo Go / when keys aren't configured.
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (user?.id != null) {
      Purchases.configure(String(user.id));
    } else {
      Purchases.logOut();
    }
  }, [user?.id]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <ErrorBoundary>
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
            <Stack.Screen name="challange-bank/quiz" options={{ headerShown: false }} />
          </Stack>
        </ErrorBoundary>
        <Toast />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
