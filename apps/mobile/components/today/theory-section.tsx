import { View } from "react-native";
import { SectionHeader } from "./section-header";
import { TheoryItem } from "./theory-item";

export type TheoryItemData = {
  id: string;
  title: string;
  icon: "cloud-download" | "lock";
  action: "get" | "unlock";
};

type TheorySectionProps = {
  title: string;
  badge?: string;
  items: TheoryItemData[];
  onSeeAll?: () => void;
  onItemPress?: (id: string) => void;
};

export function TheorySection({
  title,
  badge,
  items,
  onSeeAll,
  onItemPress,
}: TheorySectionProps) {
  return (
    <View className="mb-6">
      <SectionHeader title={title} badge={badge} onSeeAll={onSeeAll} />
      <View className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-2xl mx-4 overflow-hidden">
        {items.map((item) => (
          <TheoryItem
            key={item.id}
            title={item.title}
            icon={item.icon}
            action={item.action}
            onPress={() => onItemPress?.(item.id)}
          />
        ))}
      </View>
    </View>
  );
}
