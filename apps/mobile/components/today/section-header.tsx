import { Heading } from "@/components/ui/heading";
import { Text, TouchableOpacity, View } from "react-native";

type SectionHeaderProps = {
  title: string;
  badge?: string;
  onSeeAll?: () => void;
  showSeeAll?: boolean;
};

export function SectionHeader({
  title,
  badge,
  onSeeAll,
  showSeeAll = true,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-start justify-between px-4 mb-3 gap-3">
      <View className="flex-1 flex-row items-start gap-2">
        <Heading level="h3" weight="semibold" className="flex-shrink">
          {title}
        </Heading>
        {badge && (
          <View className="bg-blue-100 dark:bg-secondary-700 rounded-full px-2.5 py-0.5 mt-0.5">
            <Text className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 tracking-wide uppercase">
              {badge}
            </Text>
          </View>
        )}
      </View>

      {showSeeAll && (
        <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll} className="shrink-0">
          <Text className="text-base font-semibold text-primary">
            See All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
