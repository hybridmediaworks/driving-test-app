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
import { PasswordInput } from "@/components/ui/password-input";
import { Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import { api, ApiError } from "@/lib/api";

export default function ConfirmPasswordScreen() {
  const isDark = useIsDark();
  const iconColor = isDark ? Secondary[100] : Secondary[700];
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit() {
    if (!password) {
      setErrors({ password: ["Password is required"] });
      return;
    }
    setErrors({});

    setProcessing(true);
    try {
      await api.post("/confirm-password", { password });
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ password: ["Unable to confirm password. Please try again."] });
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
            Confirm your password
          </Text>
          <Text className="text-secondary-400 text-center mt-3 text-base">
            This is a secure area of the application. Please confirm your
            password before continuing.
          </Text>

          <View className="mt-8 gap-5">
            <PasswordInput
              label="Password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              error={errors.password?.[0]}
            />
          </View>
        </ScrollView>

        <View className="px-5 pb-8 pt-3">
          <Button disabled={processing} onPress={submit}>
            {processing ? "Confirming…" : "Confirm password"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
