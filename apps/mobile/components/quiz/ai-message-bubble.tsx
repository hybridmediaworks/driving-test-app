import { Primary } from "@/constants/theme";
import type { Message } from "@/hooks/use-ai-chat";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";

type Props = { message: Message };

export function AiMessageBubble({ message }: Props) {
  if (message.role === "ai") {
    return (
      <View className="flex-row gap-3 items-start">
        <MaterialIcons name="auto-awesome" size={20} color={Primary.DEFAULT} style={{ marginTop: 2 }} />
        <Text className="flex-1 text-base leading-6 text-secondary-900 dark:text-secondary-50">
          {message.text}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-end">
      <View
        className="bg-primary-50 dark:bg-primary-900 max-w-[80%] px-4 py-2.5"
        style={{ borderRadius: 16, borderBottomRightRadius: 4 }}
      >
        <Text className="text-sm text-primary-800 dark:text-primary-200">
          {message.text}
        </Text>
      </View>
    </View>
  );
}
