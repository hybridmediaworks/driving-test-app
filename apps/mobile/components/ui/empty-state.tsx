import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Secondary } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";

type Props = {
  /** Material icon name for the badge. Defaults to an empty-inbox glyph. */
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message?: string;
  /** Optional call-to-action shown below the copy. */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/**
 * Neutral placeholder for a successful load that returned nothing — "no tests here yet", "no missed
 * questions". Distinct from <ErrorState /> on purpose: an empty result is a normal state, not a
 * failure, so the tone and icon are calm rather than alarming.
 */
export function EmptyState({
  icon = "inbox",
  title,
  message,
  actionLabel,
  onAction,
  className,
}: Props) {
  const isDark = useIsDark();

  return (
    <View className={`flex-1 items-center justify-center px-8 ${className ?? ""}`}>
      <View className="w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-800 items-center justify-center mb-4">
        <MaterialIcons
          name={icon}
          size={30}
          color={isDark ? Secondary[400] : Secondary[400]}
        />
      </View>
      <Heading level="h5" className="text-center mb-2">
        {title}
      </Heading>
      {message ? (
        <Text className="text-center text-base text-secondary-500 dark:text-secondary-400 mb-6">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
