import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Button } from "@/components/ui/button";
import { Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function VerifyEmailScreen() {
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[100] : Secondary[700];
  const logout = useAuthStore((s) => s.logout);
  const [processing, setProcessing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setProcessing(true);
    try {
      await api.post("/email/verification-notification");
      setSent(true);
    } finally {
      setProcessing(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/auth/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900">
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.7}
        className="w-9 h-9 items-center justify-center mt-2 ms-4"
      >
        <MaterialIcons name="chevron-left" size={40} color={iconColor} />
      </TouchableOpacity>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-4xl font-bold text-secondary dark:text-secondary-50 mt-4 text-center leading-tight">
          Verify email
        </Text>
        <Text className="text-secondary-400 text-center mt-3 text-base">
          Please verify your email address by clicking on the link we just
          emailed to you.
        </Text>

        {sent && (
          <Text className="text-success text-center text-sm font-medium mt-6">
            A new verification link has been sent to the email address you
            provided during registration.
          </Text>
        )}
      </ScrollView>

      <View className="px-5 pb-8 pt-3 gap-5">
        <Button disabled={processing} onPress={resend}>
          {processing ? "Sending…" : "Resend verification email"}
        </Button>

        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
          className="items-center"
        >
          <Text className="text-base font-semibold text-primary dark:text-primary-400">
            {loggingOut ? "Logging out…" : "Log out"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
