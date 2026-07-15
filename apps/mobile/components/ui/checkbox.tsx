import { White } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TouchableOpacity, View } from "react-native";

type CheckboxProps = {
  checked: boolean;
  onChange: (val: boolean) => void;
  size?: number;
};

export function Checkbox({ checked, onChange, size = 26 }: CheckboxProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onChange(!checked)}
      style={{ width: size, height: size }}
    >
      <View
        className={`flex-1 rounded items-center justify-center ${
          checked
            ? "bg-primary"
            : "border-2 border-secondary-300 dark:border-secondary-600"
        }`}
      >
        {checked && (
          <MaterialIcons name="check" size={size * 0.65} color={White.DEFAULT} />
        )}
      </View>
    </TouchableOpacity>
  );
}
