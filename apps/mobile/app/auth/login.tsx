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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Secondary } from "@/constants/theme";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useIsDark } from "@/hooks/use-is-dark";
import { ApiError } from "@/lib/api";
import { collectErrors, validateEmail, validatePasswordPresent } from "@/lib/validation";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[100] : Secondary[700];
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { setErrors, clearError, errorFor } = useFormErrors();

  async function submit() {
    const nextErrors = collectErrors({
      email: validateEmail(email),
      password: validatePasswordPresent(password),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setProcessing(true);
    try {
      await login(email, password);
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ email: ["Unable to log in. Please try again."] });
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
            Log in to your account
          </Text>
          <Text className="text-secondary-400 text-center mt-3 text-base">
            Enter your email and password below to log in
          </Text>

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

            <View className="gap-2">
              <PasswordInput
                label="Password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  clearError("password");
                }}
                error={errorFor("password")}
              />
              <TouchableOpacity
                onPress={() => router.push("/auth/forgot-password")}
                activeOpacity={0.7}
                className="self-end"
              >
                <Text className="text-sm font-semibold text-primary dark:text-primary-400">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setRemember((v) => !v)}
              activeOpacity={0.8}
              className="flex-row items-center gap-3"
            >
              <Checkbox checked={remember} onChange={setRemember} size={22} />
              <Text className="text-base text-secondary-700 dark:text-secondary-200">
                Remember me
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View className="px-5 pb-8 pt-3">
          <Button disabled={processing} onPress={submit}>
            {processing ? "Logging in…" : "Log in"}
          </Button>

          <View className="flex-row items-center justify-center gap-1 mt-5">
            <Text className="text-base text-secondary-500 dark:text-secondary-400">
              Don&apos;t have an account?
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/auth/register")}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-primary dark:text-primary-400">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
