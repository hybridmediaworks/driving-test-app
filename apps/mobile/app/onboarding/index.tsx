import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/ui/chat-bubble";

const messages = [
  "Congratulations on taking the first step toward your license!",
  "You're making a smart move.",
  "Most people put off preparing, but you are already ahead of the game.",
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900">
      {/* Chat area */}
      <View className="flex-1 px-5 pt-14">
        <View className="flex-row items-start gap-3">
          <Avatar emoji="👮" size="md" />

          <View className="flex-1 gap-3">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
          </View>
        </View>
      </View>

      {/* CTA */}
      <View className="px-5 pb-8">
        <Button
          showArrow
          onPress={() => router.push("/onboarding/vehicle")}
        >Let's get started</Button>
      </View>
    </SafeAreaView>
  );
}
