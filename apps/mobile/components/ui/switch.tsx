import { Primary, Secondary } from "@/constants/theme";
import { Switch as RNSwitch } from "react-native";

type SwitchProps = {
  value: boolean;
  onValueChange: (val: boolean) => void;
};

export function Switch({ value, onValueChange }: SwitchProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Secondary[300], true: Primary[300] }}
      thumbColor={value ? Primary.DEFAULT : Secondary[50]}
      className="h-5"
    />
  );
}
