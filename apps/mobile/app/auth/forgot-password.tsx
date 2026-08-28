import { useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Secondary } from "@/constants/theme";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useIsDark } from "@/hooks/use-is-dark";
import { api, ApiError } from "@/lib/api";
import { collectErrors, validateEmail } from "@/lib/validation";

export default function ForgotPasswordScreen() {
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[100] : Secondary[700];
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const { setErrors, clearError, errorFor } = useFormErrors();
  const [sent, setSent] = useState(false);

  async function submit() {
    const nextErrors = collectErrors({ email: validateEmail(email) });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setProcessing(true);
    try {
      await api.post("/forgot-password", { email });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ email: ["Unable to send reset link. Please try again."] });
      }
    } finally {
      setProcessing(false);
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

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-4xl font-bold text-secondary dark:text-secondary-50 mt-4 text-center leading-tight">
            Forgot password
          </Text>
          <Text className="text-secondary-400 text-center mt-3 text-base">
            Enter your email to receive a password reset link
          </Text>

          {sent && (
            <Text className="text-success text-center text-sm font-medium mt-6">
              We&apos;ve emailed your password reset link.
            </Text>
          )}

          <View className="mt-8 gap-5">
            <Input
              label="Email address"
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearError("email");
              }}
              error={errorFor("email")}
            />
          </View>

          {sent && (
            <TouchableOpacity
              onPress={() => router.push("/auth/reset-password")}
              activeOpacity={0.7}
              className="items-center mt-6"
            >
              <Text className="text-sm text-secondary-500 dark:text-secondary-400">
                Already have a reset code?{" "}
                <Text className="text-primary dark:text-primary-400 font-semibold">
                  Reset password
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View className="px-5 pb-8 pt-3">
          <Button disabled={processing} onPress={submit}>
            {processing ? "Sending…" : "Email password reset link"}
          </Button>

          <View className="flex-row items-center justify-center gap-1 mt-5">
            <Text className="text-base text-secondary-500 dark:text-secondary-400">
              Or, return to
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/auth/login")}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-primary dark:text-primary-400">
                log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
