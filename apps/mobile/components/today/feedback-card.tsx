import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

type FeedbackCardProps = {
  question?: string;
  onYes?: () => void;
  onNo?: () => void;
};

export function FeedbackCard({
  question = "Enjoying DMV Genie?",
  onYes,
  onNo,
}: FeedbackCardProps) {
  return (
    <View className="mx-4 mb-8 items-center gap-4">
      <Heading level="h3">
        {question} {"👋"}
      </Heading>

      <View className="flex-row gap-4">
        {/* No button */}
        <Button onPress={onNo} variant="secondary-outline" className="min-w-28">
          <MaterialIcons name="thumb-down-off-alt" size={20} />
          No
        </Button>
        <Button
          onPress={onYes}
          variant="secondary-outline"
          className="min-w-28"
        >
          <MaterialIcons name="thumb-up-off-alt" size={20} />
          Yes
        </Button>
      </View>
    </View>
  );
}
