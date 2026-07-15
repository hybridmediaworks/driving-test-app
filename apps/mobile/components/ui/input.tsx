import { View, Text, TextInput, type TextInputProps } from "react-native";
import { useIsDark } from "@/hooks/use-is-dark";
import { Secondary } from "@/constants/theme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...rest }: InputProps) {
  const isDark = useIsDark();

  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
          {label}
        </Text>
      )}

      <TextInput
        className={`bg-secondary-100 dark:bg-secondary-800 rounded-xl px-4 py-4 text-base text-secondary dark:text-secondary-50
          ${error ? "border border-error" : "border border-transparent"}`}
        placeholderTextColor={isDark ? Secondary[600] : Secondary[400]}
        {...rest}
      />

      {error && (
        <Text className="text-xs text-error mt-0.5">{error}</Text>
      )}
    </View>
  );
}
