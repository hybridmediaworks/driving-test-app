import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Error as ErrorColor } from "@/constants/theme";

type Props = {
  title?: string;
  message?: string;
  /** When provided, renders a "Try again" button that calls this. Omit for non-recoverable errors. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Material icon name for the badge. Defaults to a disconnected-network glyph. */
  icon?: keyof typeof MaterialIcons.glyphMap;
  className?: string;
};

/**
 * Friendly, recoverable error placeholder for a failed data load. Screens render this instead of
 * leaving a blank page (or a spinner that never resolves) when a fetch rejects — the retry button
 * re-runs the request. Copy stays generic on purpose: we never surface raw error strings to users.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  icon = "wifi-off",
  className,
}: Props) {
  return (
    <View className={`flex-1 items-center justify-center px-8 ${className ?? ""}`}>
      <View className="w-16 h-16 rounded-full bg-error/10 items-center justify-center mb-4">
        <MaterialIcons name={icon} size={30} color={ErrorColor.DEFAULT} />
      </View>
      <Heading level="h5" className="text-center mb-2">
        {title}
      </Heading>
      <Text className="text-center text-base text-secondary-500 dark:text-secondary-400 mb-6">
        {message}
      </Text>
      {onRetry ? (
        <Button variant="outline" onPress={onRetry}>
          <MaterialIcons name="refresh" size={20} /> {retryLabel}
        </Button>
      ) : null}
    </View>
  );
}
