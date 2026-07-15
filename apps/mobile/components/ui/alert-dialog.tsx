import { Error } from "@/constants/theme";
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Heading } from "./heading";

type AlertDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export function AlertDialog({
  visible,
  title,
  description,
  confirmText,
  onConfirm,
  onCancel,
  destructive = false,
}: AlertDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          className="items-center justify-center"
        >
          <TouchableWithoutFeedback>
            <View
              className="bg-white dark:bg-secondary-800 rounded-2xl overflow-hidden"
              style={{ width: "90%" }}
            >
              {/* Title & message */}
              <View className="px-6 py-5">
                <Heading level="h4" className="text-center mb-2">
                  {title}
                </Heading>
                <Text className="text-base text-center text-secondary-500 dark:text-secondary-400">
                  {description}
                </Text>
              </View>

              {/* Divider */}
              <View className="h-px bg-secondary-200 dark:bg-secondary-700" />

              {/* Buttons */}
              <View className="flex-row">
                <TouchableOpacity
                  onPress={onCancel}
                  activeOpacity={0.7}
                  className="flex-1 py-4 items-center justify-center"
                >
                  <Text className="text-base font-semibold text-secondary-500 dark:text-secondary-400">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <View className="w-px bg-secondary-200 dark:bg-secondary-700" />

                <TouchableOpacity
                  onPress={onConfirm}
                  activeOpacity={0.7}
                  className="flex-1 py-4 items-center justify-center"
                >
                  <Text
                    className={`text-base font-semibold ${!destructive ? "text-primary dark:text-primary-400" : ""}`}
                    style={destructive ? { color: Error.DEFAULT } : undefined}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
