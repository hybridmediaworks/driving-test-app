import { View, Text } from "react-native";

type ChatBubbleProps = {
  message: string;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  return (
    <View className="bg-primary-50 rounded-2xl px-4 py-3">
      <Text className="text-base text-secondary leading-6">{message}</Text>
    </View>
  );
}
