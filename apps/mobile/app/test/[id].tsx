import TestIntroHeader from "@/components/intro-header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Primary } from "@/constants/theme";
import { getTestById } from "@/services/testService";
import { useUserStore } from "@/store/userStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Image,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const DESCRIPTION_LINE_LIMIT = 4;

export default function TestIntroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const stateName = useUserStore((s) => s.state) ?? "Your State";
  const [expanded, setExpanded] = useState(false);
  const [totalLines, setTotalLines] = useState<number | null>(null);
  const isTruncated =
    totalLines !== null && totalLines > DESCRIPTION_LINE_LIMIT;
  const scrollY = useRef(new Animated.Value(0)).current;
  const test = getTestById(id);

  if (!test) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900 items-center justify-center">
        <Text className="text-secondary-500">Test not found.</Text>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    await Share.share({ message: `Practice for your DMV exam: ${test.title}` });
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white-off dark:bg-secondary-900 relative"
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <TestIntroHeader
        backUrl={() => router.back()}
        title={test.title}
        description={`${stateName} • ${test.questionsCount} questions • ${test.passingScore}% to pass`}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 155,
          paddingBottom: 24,
          paddingInline: 16,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* Cover image */}
        <Image
          source={test.image}
          className="w-full rounded-xl"
          style={{ height: 280 }}
          resizeMode="cover"
        />
        <Heading level="h3" className="my-4">
          About
        </Heading>
        {/* About */}
        <View className="p-5 bg-white dark:bg-secondary-800 shadow-md shadow-slate-200 dark:shadow-secondary rounded-xl">
          <Heading level="h6" className="mb-3" color="secondary">
            Description
          </Heading>

          <Text
            onTextLayout={(e) => {
              if (totalLines === null)
                setTotalLines(e.nativeEvent.lines.length);
            }}
            numberOfLines={
              totalLines === null
                ? undefined
                : isTruncated && !expanded
                  ? DESCRIPTION_LINE_LIMIT
                  : undefined
            }
            className="text-lg leading-6 text-secondary-600 dark:text-secondary-400"
          >
            {test.description}
          </Text>
          {isTruncated && (
            <TouchableOpacity
              onPress={() => setExpanded((v) => !v)}
              activeOpacity={0.7}
              className="flex-row items-center mt-2 gap-1 justify-end"
            >
              <Text className="text-lg font-medium text-primary">
                {expanded ? "Collapse" : "Expand"}
              </Text>
              <MaterialIcons
                name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={18}
                color={Primary.DEFAULT}
              />
            </TouchableOpacity>
          )}
        </View>
        {/* Share */}
        <View className="bg-white dark:bg-secondary-800 shadow-md shadow-slate-200 dark:shadow-secondary rounded-xl mt-4 justify-start items-start px-2">
          <Button onPress={handleShare} variant="ghost">
            <MaterialIcons name="ios-share" size={20} /> Share
          </Button>
        </View>
      </Animated.ScrollView>

      {/* Start button */}
      <View className="px-5 pb-4 pt-3 border-t border-secondary-100 dark:border-secondary-800">
        <Button showArrow onPress={() => router.push(`/test/quiz/${test.id}`)}>
          Start
        </Button>
      </View>
    </SafeAreaView>
  );
}
