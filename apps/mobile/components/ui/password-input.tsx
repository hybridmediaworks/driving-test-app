import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useIsDark } from "@/hooks/use-is-dark";
import { Secondary } from "@/constants/theme";

type PasswordInputProps = Omit<TextInputProps, "secureTextEntry"> & {
  label?: string;
  error?: string;
};

export function PasswordInput({ label, error, ...rest }: PasswordInputProps) {
  const isDark = useIsDark();
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
          {label}
        </Text>
      )}

      <View className="justify-center">
        <TextInput
          className={`bg-secondary-100 dark:bg-secondary-800 rounded-xl px-4 py-4 pr-12 text-base text-secondary dark:text-secondary-50
            ${error ? "border border-error" : "border border-transparent"}`}
          placeholderTextColor={isDark ? Secondary[600] : Secondary[400]}
          secureTextEntry={!visible}
          autoCapitalize="none"
          {...rest}
        />
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          activeOpacity={0.7}
          hitSlop={8}
          className="absolute right-4"
        >
          <MaterialIcons
            name={visible ? "visibility-off" : "visibility"}
            size={20}
            color={isDark ? Secondary[400] : Secondary[500]}
          />
        </TouchableOpacity>
      </View>

      {error && <Text className="text-xs text-error mt-0.5">{error}</Text>}
    </View>
  );
}
