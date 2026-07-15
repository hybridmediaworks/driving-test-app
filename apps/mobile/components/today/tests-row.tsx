import { ScrollView, View, ImageSourcePropType } from "react-native";
import { TestCard } from "./test-card";
import { SectionHeader } from "./section-header";

export type TestItem = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  locked?: boolean;
  result?: "passed" | "failed";
};

type TestsRowProps = {
  title: string;
  badge?: string;
  tests: TestItem[];
  onSeeAll?: () => void;
  onTestPress?: (id: string) => void;
};

export function TestsRow({ title, badge, tests, onSeeAll, onTestPress }: TestsRowProps) {
  return (
    <View className="mb-6">
      <SectionHeader title={title} badge={badge} onSeeAll={onSeeAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {tests.map((test) => (
          <TestCard
            key={test.id}
            title={test.title}
            subtitle={test.subtitle}
            image={test.image}
            locked={test.locked}
            result={test.result}
            onPress={() => onTestPress?.(test.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
