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
import { PasswordInput } from "@/components/ui/password-input";
import { Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { api, ApiError } from "@/lib/api";

export default function ResetPasswordScreen() {
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[100] : Secondary[700];
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit() {
    const nextErrors: Record<string, string[]> = {};
    if (!token) nextErrors.token = ["Reset code is required"];
    if (!email) nextErrors.email = ["Email is required"];
    if (!password) nextErrors.password = ["Password is required"];
    if (passwordConfirmation !== password) {
      nextErrors.password_confirmation = ["Passwords do not match"];
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setProcessing(true);
    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace("/auth/login");
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ email: ["Unable to reset password. Please try again."] });
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
            Reset password
          </Text>
          <Text className="text-secondary-400 text-center mt-3 text-base">
            Please enter your new password below
          </Text>

          <View className="mt-8 gap-5">
            <Input
              label="Reset code"
              placeholder="Paste the code from your email"
              autoCapitalize="none"
              value={token}
              onChangeText={setToken}
              error={errors.token?.[0]}
            />

            <Input
              label="Email"
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={errors.email?.[0]}
            />

            <PasswordInput
              label="Password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              error={errors.password?.[0]}
            />

            <PasswordInput
              label="Confirm password"
              placeholder="Confirm password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              error={errors.password_confirmation?.[0]}
            />
          </View>
        </ScrollView>

        <View className="px-5 pb-8 pt-3">
          <Button disabled={processing} onPress={submit}>
            {processing ? "Resetting…" : "Reset password"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
