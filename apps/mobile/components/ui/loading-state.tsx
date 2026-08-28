import { ActivityIndicator, Text, View } from "react-native";

import { Primary } from "@/constants/theme";

type Props = {
  /** Optional caption under the spinner, e.g. "Loading your progress…". */
  label?: string;
  /** Extra classes for the wrapper — defaults to filling and centring its parent. */
  className?: string;
};

/**
 * Centred loading indicator. Screens render this in place of their content while the first fetch is
 * in flight, so every screen shows the same spinner instead of each hand-rolling one.
 */
export function LoadingState({ label, className }: Props) {
  return (
    <View className={`flex-1 items-center justify-center px-8 ${className ?? ""}`}>
      <ActivityIndicator size="large" color={Primary.DEFAULT} />
      {label ? (
        <Text className="mt-3 text-center text-base text-secondary-500 dark:text-secondary-400">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
