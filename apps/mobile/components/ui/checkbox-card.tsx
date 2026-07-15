import { White } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View, Text, TouchableOpacity } from "react-native";

type CheckboxCardProps = {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
};

export function CheckboxCard({ id, label, checked, onToggle }: CheckboxCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onToggle(id)}
      className="flex-row items-center rounded-2xl px-4 py-5 bg-secondary-100 dark:bg-secondary-800"
    >
      <Text className="flex-1 text-base text-secondary dark:text-secondary-50">{label}</Text>

      <View
        className={`w-7 h-7 rounded-md items-center justify-center ${
          checked
            ? "bg-primary"
            : "border-2 border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700"
        }`}
      >
        {checked && <MaterialIcons name="check" size={18} color={White.DEFAULT} />}
      </View>
    </TouchableOpacity>
  );
}
