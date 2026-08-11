import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Primary, Secondary } from "@/constants/theme";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { US_STATES } from "@/constants/us-states";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import { useThemeStore } from "@/store/themeStore";
import { useUserStore } from "@/store/userStore";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SettingsRowProps = {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
};

function SettingsRow({
  label,
  value,
  right,
  onPress,
  isLast,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 ${
        !isLast ? "border-b border-secondary-100 dark:border-secondary-700" : ""
      }`}
    >
      <Text className="text-base text-secondary-900 dark:text-secondary-100">
        {label}
      </Text>
      {right ??
        (value ? (
          <View className="flex-row items-center" style={{ gap: 2 }}>
            <Text className="text-base text-secondary-400 dark:text-secondary-500">
              {value}
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={18}
              color={Secondary[400]}
            />
          </View>
        ) : null)}
    </TouchableOpacity>
  );
}

type ActionRowProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress?: () => void;
  isLast?: boolean;
};

function ActionRow({ label, icon, onPress, isLast }: ActionRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 ${
        !isLast ? "border-b border-secondary-100 dark:border-secondary-700" : ""
      }`}
      style={{ gap: 14 }}
    >
      <MaterialIcons name={icon} size={22} color={Primary.DEFAULT} />
      <Text className="text-base font-medium text-primary dark:text-primary-400">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RadioButton({
  selected,
  onPress,
  label,
  isDark,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  isDark: boolean;
}) {
  const activeColor = isDark ? Primary[400] : Primary.DEFAULT;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center"
      style={{ gap: 4 }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? activeColor : Secondary[400],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: activeColor,
            }}
          />
        )}
      </View>
      <Text className="text-base text-secondary-700 dark:text-secondary-200">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const EXAM_DATE_LABELS: Record<string, string> = {
  "0-3": "0–3 days",
  "4-7": "4–7 days",
  "8-14": "8–14 days",
  "15+": "15+ days",
};

const VEHICLE_LABELS: Record<string, string> = {
  car: "Car",
  motorcycle: "Motorcycle",
  truck: "Truck (CDL)",
};

export default function SettingsScreen() {
  const { preference, setPreference } = useThemeStore();
  const { vehicleType, state, examDateRange } = useUserStore();
  const { resetProgress } = useProgressStore();
  const { clearAll: clearChallengeBank } = useChallengeBankStore();
  const { user, logout } = useAuthStore();

  const isDark = preference === "dark";
  const [pushEnabled, setPushEnabled] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  const stateEntry = US_STATES.find((s) => s.id === state);
  const stateLabel = stateEntry ? stateEntry.id : "Not Set";
  const vehicleLabel = vehicleType ? VEHICLE_LABELS[vehicleType] : "Not Set";
  const examLabel = examDateRange ? EXAM_DATE_LABELS[examDateRange] : "Not Set";

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "I'm using DMV Genie to prepare for my driving test! Check it out.",
      });
    } catch {}
  };

  const handleReset = () => setResetModalVisible(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView
      className="flex-1 bg-white-off dark:bg-secondary-900"
      edges={["top"]}
    >
      <Header title="Settings" scrollY={scrollY} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 93,
          paddingBottom: 24,
          paddingInline: 16,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {user ? (
          <View className="rounded-2xl bg-white dark:bg-secondary-800 mb-6 p-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text
                numberOfLines={1}
                className="text-base font-semibold text-secondary-900 dark:text-secondary-100"
              >
                {user.name}
              </Text>
              <Text
                numberOfLines={1}
                className="text-sm text-secondary-400 dark:text-secondary-500"
              >
                {user.email}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout} disabled={loggingOut}>
              <Text className="text-base font-semibold text-primary dark:text-primary-400">
                {loggingOut ? "Logging out…" : "Log out"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="rounded-2xl bg-white dark:bg-secondary-800 mb-6 p-4 flex-row gap-3">
            <Button
              variant="secondary-outline"
              size="md"
              className="flex-1"
              onPress={() => router.push("/auth/login")}
            >
              Log in
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onPress={() => router.push("/auth/register")}
            >
              Sign up
            </Button>
          </View>
        )}

        <View className="rounded-2xl overflow-hidden bg-white dark:bg-secondary-800 mb-6">
          <SettingsRow
            label="Premium Subscription"
            right={
              <TouchableOpacity
                onPress={() => {}}
                className="flex-row items-center"
                style={{ gap: 2 }}
              >
                <Text className="text-base text-primary dark:text-primary-400">
                  Manage
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={18}
                  color={isDark ? Primary[400] : Primary.DEFAULT}
                />
              </TouchableOpacity>
            }
          />
          <SettingsRow
            label="Change State"
            value={stateLabel}
            onPress={() => router.push("/onboarding/states?from=settings")}
          />
          <SettingsRow
            label="Change Vehicle Type"
            value={vehicleLabel}
            onPress={() => router.push("/onboarding/vehicle?from=settings")}
          />
          <SettingsRow
            label="Exam Date"
            value={examLabel}
            onPress={() => router.push("/onboarding/exam-date?from=settings")}
          />
          <SettingsRow
            label="Push notification"
            isLast
            right={
              <Switch value={pushEnabled} onValueChange={setPushEnabled} />
            }
          />
        </View>

        {/* Section 2 — Premium */}
        <View className="mb-3">
          <Heading level="h4" weight="bold">
            Premium
          </Heading>
        </View>
        <View className="rounded-2xl overflow-hidden bg-white dark:bg-secondary-800 mb-6">
          <SettingsRow
            label="DMV Genie Premium"
            right={
              <TouchableOpacity onPress={() => router.push("/premium")}>
                <Text className="text-base font-semibold text-primary dark:text-primary-400">
                  Get it
                </Text>
              </TouchableOpacity>
            }
          />
          <SettingsRow
            label="Night Mode"
            right={
              <Switch
                value={isDark}
                onValueChange={(val) => setPreference(val ? "dark" : "light")}
              />
            }
          />

          <SettingsRow
            label="Test Language"
            right={
              <View className="flex-row items-center" style={{ gap: 14 }}>
                <RadioButton
                  selected={language === "en"}
                  onPress={() => setLanguage("en")}
                  label="En"
                  isDark={isDark}
                />
                <RadioButton
                  selected={language === "es"}
                  onPress={() => setLanguage("es")}
                  label="Es"
                  isDark={isDark}
                />
              </View>
            }
          />
          <SettingsRow
            label="Reset All Results"
            isLast
            right={
              <TouchableOpacity onPress={handleReset}>
                <Text className="text-base font-semibold text-primary dark:text-primary-400">
                  Reset
                </Text>
              </TouchableOpacity>
            }
          />
        </View>

        {/* Section 3 — Enjoying DMV Genie? */}
        <View className="mb-3">
          <Heading level="h4" weight="bold">
            Enjoying DMV Genie?
          </Heading>
        </View>
        <View className="rounded-2xl overflow-hidden bg-white dark:bg-secondary-800 mb-8">
          <ActionRow label="Share" icon="share" onPress={handleShare} />
          <ActionRow
            label="Leave a Review"
            icon="star-border"
            onPress={() => {}}
          />
          <ActionRow
            label="Report an Issue"
            icon="error-outline"
            onPress={() => {}}
            isLast
          />
        </View>
      </Animated.ScrollView>

      <AlertDialog
        visible={resetModalVisible}
        title="Reset All Results"
        description="Are you sure you want to reset all your test results? This cannot be undone."
        confirmText="Reset"
        destructive
        onConfirm={() => {
          resetProgress();
          clearChallengeBank();
          setResetModalVisible(false);
        }}
        onCancel={() => setResetModalVisible(false)}
      />
    </SafeAreaView>
  );
}
