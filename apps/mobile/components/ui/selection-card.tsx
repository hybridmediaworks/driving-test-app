import { View, Text, TouchableOpacity } from "react-native";

type SelectionCardProps = {
  id: string;
  title: string;
  selected: boolean;
  onSelect: (id: string) => void;
  emoji?: string;
  description?: string;
};

export function SelectionCard({
  id,
  title,
  selected,
  onSelect,
  emoji,
  description,
}: SelectionCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect(id)}
      className={`flex-row items-center rounded-2xl px-4 py-4 ${
        selected
          ? "bg-primary-50 dark:bg-primary-900 border border-primary-400 dark:border-primary-600"
          : "bg-secondary-100 dark:bg-secondary-800"
      }`}
    >
      {/* Optional emoji */}
      {emoji && (
        <View className="w-16 items-center">
          <Text style={{ fontSize: 42 }}>{emoji}</Text>
        </View>
      )}

      {/* Labels */}
      <View className={`flex-1 ${emoji ? "ml-2" : ""}`}>
        <Text className="text-base font-semibold text-secondary dark:text-secondary-50">
          {title}
        </Text>
        {description && (
          <Text className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
            {description}
          </Text>
        )}
      </View>

      {/* Radio indicator */}
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          selected
            ? "border-primary dark:border-primary-400"
            : "border-secondary-300 dark:border-secondary-600"
        }`}
      >
        {selected && <View className="w-3 h-3 rounded-full bg-primary dark:bg-primary-400" />}
      </View>
    </TouchableOpacity>
  );
}
