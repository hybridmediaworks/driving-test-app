import { TrialSheet } from "@/components/premium/trial-sheet";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Primary, Warning, White } from "@/constants/theme";
import { usePlanStore } from "@/store/planStore";
import { useReferenceDataStore } from "@/store/referenceDataStore";
import { useUserStore } from "@/store/userStore";
import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAVY_BG = Primary[1000]; // "#0D142C" — dark navy paywall background
const CARD_BG = "#121B3B";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.55)";
const GREEN = "#4ADE80";
const TEAL = "#2DD4BF";
const TEAL_BG = "rgba(45,212,191,0.12)";
const STAR_COLOR = Warning[500];

const AVATAR_COLORS = [
  "#3B5BDB",
  "#2F9E44",
  "#E8590C",
  "#9C36B5",
  "#1098AD",
  "#C2255C",
  "#5C7CFA",
  "#F08C00",
];

function PlaceholderPhoto({ index, size = 72 }: { index: number; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FontAwesome5 name="user-alt" size={size * 0.36} color="rgba(255,255,255,0.55)" />
    </View>
  );
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <View className="flex-row items-center gap-1.5">
        <FontAwesome5 name="angle-left" size={22} color="rgba(255,255,255,0.3)" />
        <Text className="text-white text-lg font-extrabold">{value}</Text>
        <FontAwesome5 name="angle-right" size={22} color="rgba(255,255,255,0.3)" />
      </View>
      <Text style={{ color: MUTED }} className="text-xs text-center mt-1">
        {label}
      </Text>
    </View>
  );
}

const TRIAL_HIGHLIGHTS = [
  { icon: "clipboard-text-outline" as const, label: "500+ exam-\nlike questions" },
  { icon: "shield-check" as const, label: "Plain-English\nexplanations" },
];

const COMPARE_ROWS: { feature: string; limited: boolean }[] = [
  { feature: "Exam-like questions", limited: true },
  { feature: "AI Driving Coach", limited: true },
  { feature: "Quiz Vault™", limited: true },
  { feature: "2 PDF Cheat Sheets", limited: false },
  { feature: "Exam Simulator", limited: false },
  { feature: "Marathons", limited: false },
  { feature: "Pass Guarantee", limited: false },
];

function Stars({ count = 5 }: { count?: number }) {
  return (
    <View className="flex-row gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <FontAwesome5 key={i} name="star" solid size={16} color={STAR_COLOR} />
      ))}
    </View>
  );
}

const REVIEWS = [
  {
    title: "This helps WAYYYYY more that I thought it would",
    author: "Shellrockgun",
    date: "May 30, 2026",
    body: "Before I felt confident, but I didn't know much for the actual DMV wording until I started using this every day.",
  },
  {
    title: "100% suggest if you're struggling with the Dmv test",
    author: "Luckyeye88",
    date: "Jun 28, 2026",
    body: "This is the best app I ever found for the DMV. It helped me pass all my tests with flying colors. The same questions they ask you at the DMV are the same practice questions they ask you in here.",
  },
];

const PRESS = [
  "USA TODAY",
  "NBC",
  "CBS NEWS",
  "Newsweek",
  "FORTUNE",
  "Cars.com",
  "McKinsey & Company",
  "THE DRIVE",
];

export default function PremiumScreen() {
  const router = useRouter();
  const [showTrialSheet, setShowTrialSheet] = useState(false);
  const stateCode = useUserStore((s) => s.state);
  const states = useReferenceDataStore((s) => s.states);
  const fetchStates = useReferenceDataStore((s) => s.fetchStates);
  const plans = usePlanStore((s) => s.plans);
  const fetchPlans = usePlanStore((s) => s.fetchPlans);

  useEffect(() => {
    fetchStates();
    fetchPlans();
  }, [fetchStates, fetchPlans]);

  const stateName =
    states.find((s) => s.code === stateCode)?.name ?? "your state";
  // Trial length is read from the live plan that offers a trial, not hardcoded — keeps the paywall
  // in sync with whatever pricing/trial the backend serves.
  const trialDays = plans.find((p) => p.trial_days != null)?.trial_days ?? 3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY_BG }} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Photo grid */}
        <View className="flex-row flex-wrap px-4 pt-4 gap-3 justify-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <PlaceholderPhoto key={i} index={i} />
          ))}
        </View>

        {/* Headline */}
        <View className="px-6 mt-6">
          <Heading level="h2" color="white" className="text-center leading-tight">
            See exactly what the DMV test looks like in {stateName}
          </Heading>
        </View>

        {/* Trust stats */}
        <View className="flex-row px-6 mt-6">
          <TrustStat value="97%" label={"Pass on\na first try"} />
          <TrustStat value="4.8" label={"In Google\nPlay"} />
          <TrustStat value="9M+" label={"Drivers\npassed"} />
        </View>

        {/* Free trial card */}
        <View
          className="mx-5 mt-6 rounded-3xl p-5"
          style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER }}
        >
          <Text className="text-center text-xl font-bold">
            <Text style={{ color: GREEN }}>{trialDays}-day free trial</Text>
            <Text className="text-white"> includes everything</Text>
          </Text>
          <Text style={{ color: MUTED }} className="text-center text-sm mt-1">
            No fluff, just what your state actually tests.
          </Text>

          <View className="flex-row justify-center gap-10 mt-5">
            {TRIAL_HIGHLIGHTS.map((item) => (
              <View key={item.label} className="items-center" style={{ maxWidth: 100 }}>
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <MaterialCommunityIcons name={item.icon} size={26} color={White.DEFAULT} />
                </View>
                <Text className="text-white text-xs text-center font-medium">{item.label}</Text>
              </View>
            ))}
            <View className="items-center" style={{ maxWidth: 100 }}>
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <FontAwesome5 name="user-shield" size={22} color={White.DEFAULT} />
              </View>
              <Text className="text-white text-xs text-center font-medium">{"AI Officer\nFrank"}</Text>
            </View>
          </View>
        </View>

        {/* Feature comparison table */}
        <View className="px-5 mt-8">
          <View className="flex-row items-center pb-3">
            <Text style={{ color: MUTED }} className="flex-1 text-xs font-semibold uppercase tracking-wide">
              Features
            </Text>
            <Text className="w-20 text-center text-white text-xs font-bold uppercase">
              No trial
            </Text>
            <View className="w-24 items-center">
              <LinearGradient
                colors={["#8B5CF6", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}
              >
                <Text className="text-white text-xs font-bold uppercase">{trialDays}-Day Trial</Text>
              </LinearGradient>
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1">
              {COMPARE_ROWS.map((row) => (
                <View key={row.feature} style={{ paddingVertical: 10 }}>
                  <Text className="text-white text-sm">{row.feature}</Text>
                </View>
              ))}
            </View>
            <View className="w-20 items-center">
              {COMPARE_ROWS.map((row) => (
                <View key={row.feature} style={{ paddingVertical: 10 }}>
                  {row.limited ? (
                    <Text style={{ color: MUTED }} className="text-xs font-semibold uppercase">
                      Limited
                    </Text>
                  ) : (
                    <MaterialIcons name="lock" size={16} color="rgba(255,255,255,0.35)" />
                  )}
                </View>
              ))}
            </View>
            <View
              className="w-24 items-center"
              style={{ backgroundColor: TEAL_BG, borderRadius: 16 }}
            >
              {COMPARE_ROWS.map((row) => (
                <View key={row.feature} style={{ paddingVertical: 10 }}>
                  <Text style={{ color: TEAL, fontSize: 16, fontWeight: "700" }}>&#8734;</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Pull-quote */}
        <View className="px-6 mt-10">
          <Text className="text-white text-2xl font-semibold text-center italic leading-8">
            &quot;These questions were identical to my real test&quot;
          </Text>
          <View className="items-center mt-4">
            <Stars />
          </View>
          <Text style={{ color: MUTED }} className="text-center mt-4 leading-6">
            The #1 worry we hear: &quot;Real questions will look different.&quot; Our
            questions mirror your state wording and tricky edge cases, so the
            real exam feels familiar. Our users are saying the same thing:
            &quot;It felt like I&apos;d seen every question before.&quot;
          </Text>
        </View>

        {/* Photo row */}
        <View className="flex-row justify-center gap-3 px-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <PlaceholderPhoto key={i} index={i + 4} />
          ))}
        </View>

        {/* Reviews */}
        {REVIEWS.map((review) => (
          <View
            key={review.author}
            className="mx-5 mt-6 rounded-3xl p-5"
            style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER }}
          >
            <Stars />
            <Text className="text-white text-lg font-bold mt-3">{review.title}</Text>
            <Text style={{ color: MUTED }} className="text-xs mt-1">
              {review.date} - {review.author}
            </Text>
            <Text style={{ color: MUTED }} className="text-sm mt-3 leading-6">
              {review.body}
            </Text>
          </View>
        ))}

        {/* Large closing photo */}
        <View className="px-5 mt-6">
          <View
            style={{
              height: 200,
              borderRadius: 20,
              backgroundColor: AVATAR_COLORS[2],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={48}
              color="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* Skip */}
        <View className="items-center mt-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: MUTED }} className="text-sm">
              Skip, I don&apos;t want free trial
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seen on */}
        <View className="mt-8 px-6">
          <Text style={{ color: MUTED }} className="text-center text-sm font-semibold mb-4">
            Seen on
          </Text>
          <View className="flex-row flex-wrap justify-center gap-x-8 gap-y-4">
            {PRESS.map((name) => (
              <Text key={name} className="text-white text-sm font-bold opacity-70">
                {name}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View className="px-5 pt-3 pb-2" style={{ borderTopWidth: 1, borderTopColor: BORDER }}>
        <Button
          variant="primary"
          size="lg"
          showArrow
          className="w-full"
          onPress={() => setShowTrialSheet(true)}
        >
          Continue
        </Button>
        <Text style={{ color: MUTED }} className="text-center text-xs mt-2">
          No payment required now, easy to cancel
        </Text>
      </View>

      <TrialSheet visible={showTrialSheet} onClose={() => setShowTrialSheet(false)} />
    </SafeAreaView>
  );
}
