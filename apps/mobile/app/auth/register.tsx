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
import { useFormErrors } from "@/hooks/use-form-errors";
import { useIsDark } from "@/hooks/use-is-dark";
import { ApiError } from "@/lib/api";
import {
  collectErrors,
  validateEmail,
  validateMatch,
  validateNewPassword,
  validateRequired,
} from "@/lib/validation";
import { useAuthStore } from "@/store/authStore";

export default function RegisterScreen() {
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[100] : Secondary[700];
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [processing, setProcessing] = useState(false);
  const { setErrors, clearError, errorFor } = useFormErrors();

  async function submit() {
    const nextErrors = collectErrors({
      name: validateRequired(name, "Name"),
      email: validateEmail(email),
      password: validateNewPassword(password),
      password_confirmation: validateMatch(passwordConfirmation, password),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setProcessing(true);
    try {
      await register(name, email, password, passwordConfirmation);
      router.push("/auth/verify-email");
    } catch (err) {
      console.error("register failed:", err);
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ email: ["Unable to create account. Please try again."] });
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
            Create an account
          </Text>
          <Text className="text-secondary-400 text-center mt-3 text-base">
            Enter your details below to create your account
          </Text>

          <View className="mt-8 gap-5">
            <Input
              label="Name"
              placeholder="Full name"
              autoCapitalize="words"
              autoComplete="name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                clearError("name");
              }}
              error={errorFor("name")}
            />

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

            <PasswordInput
              label="Password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearError("password");
              }}
              error={errorFor("password")}
            />

            <PasswordInput
              label="Confirm password"
              placeholder="Confirm password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChangeText={(v) => {
                setPasswordConfirmation(v);
                clearError("password_confirmation");
              }}
              error={errorFor("password_confirmation")}
            />
          </View>
        </ScrollView>

        <View className="px-5 pb-8 pt-3">
          <Button disabled={processing} onPress={submit}>
            {processing ? "Creating account…" : "Create account"}
          </Button>

          <View className="flex-row items-center justify-center gap-1 mt-5">
            <Text className="text-base text-secondary-500 dark:text-secondary-400">
              Already have an account?
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/auth/login")}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-primary dark:text-primary-400">
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
