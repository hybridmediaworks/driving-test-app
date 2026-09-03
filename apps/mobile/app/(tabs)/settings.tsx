import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Primary, Secondary } from "@/constants/theme";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api";
import { requestAppRating } from "@/lib/appRating";
import { reportAnIssue } from "@/lib/support";
import { cancelSubscription, getBillingPortalUrl } from "@/services/api/billingApi";
import { useAuthStore } from "@/store/authStore";
import { resetAllResults } from "@/services/api/progressService";
import { useProgressStore } from "@/store/progressStore";
import { useChallengeBankStore } from "@/store/challengeBankStore";
import { useReferenceDataStore } from "@/store/referenceDataStore";
import { useThemeStore } from "@/store/themeStore";
import { toast } from "@/store/toastStore";
import { useUserStore, type TestLanguage } from "@/store/userStore";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Share, Text, TouchableOpacity, View } from "react-native";
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

export default function SettingsScreen() {
  const { preference, setPreference } = useThemeStore();
  const { vehicleType, state, examDateRange, testLanguage, setTestLanguage } =
    useUserStore();
  const { resetProgress } = useProgressStore();
  const { clearAll: clearChallengeBank } = useChallengeBankStore();
  const { user, logout } = useAuthStore();
  // Backend-owned entitlement is the source of truth (RevenueCat's webhook feeds it) — same check the
  // rest of the app uses to gate premium features.
  const isPremium = useAuthStore((s) => s.user?.entitlement?.is_premium) ?? false;
  const states = useReferenceDataStore((s) => s.states);
  const vehicleTypes = useReferenceDataStore((s) => s.vehicleTypes);
  const fetchStates = useReferenceDataStore((s) => s.fetchStates);
  const fetchVehicleTypes = useReferenceDataStore((s) => s.fetchVehicleTypes);

  useEffect(() => {
    fetchStates();
    fetchVehicleTypes();
  }, [fetchStates, fetchVehicleTypes]);

  const isDark = preference === "dark";
  const [pushEnabled, setPushEnabled] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out");
    } finally {
      setLoggingOut(false);
    }
  }

  const stateEntry = states.find((s) => s.code === state);
  const stateLabel = stateEntry ? stateEntry.code : "Not Set";
  const vehicleLabel = vehicleType
    ? (vehicleTypes.find((v) => v.name === vehicleType)?.title ?? "Not Set")
    : "Not Set";
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

  // "Change Plan" — open the Stripe self-service billing portal (change plan / payment / cancel).
  const handleChangePlan = async () => {
    try {
      const url = await getBillingPortalUrl();
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      // Surface the server's own reason for 4xx (e.g. "no active subscription", "email not
      // verified"); keep a generic line for 5xx / network trouble.
      toast.error(
        err instanceof ApiError && err.status < 500 && err.message
          ? err.message
          : "Couldn't open the billing page. Please try again.",
      );
    }
  };

  // "Cancel Subscription" — cancel in-app via the backend. Access stays until the billing period
  // ends; refresh the user afterwards so the subscription/entitlement state is up to date.
  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Your Premium access stays active until the end of the current billing period. Cancel your subscription?",
      [
        { text: "Keep Premium", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            if (cancelling) return;
            setCancelling(true);
            try {
              const message = await cancelSubscription();
              toast.success(message);
              await useAuthStore.getState().hydrate();
            } catch (err) {
              toast.error(
                err instanceof ApiError && err.status < 500 && err.message
                  ? err.message
                  : "Couldn't cancel your subscription. Please try again.",
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  };

  const handleTestLanguageChange = (language: TestLanguage) => {
    if (language === testLanguage) return; // already selected — no toast, no reload churn
    setTestLanguage(language);
    toast.success(
      language === "es"
        ? "Test language changed to Spanish"
        : "Test language changed to English",
    );
  };
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
              <Switch
                value={pushEnabled}
                onValueChange={(value) => {
                  setPushEnabled(value);
                  toast.success(
                    value ? "Push notifications on" : "Push notifications off",
                  );
                }}
              />
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
          {isPremium ? (
            <>
              {/* Active subscriber — let them switch plan or cancel (both via the store). */}
              <SettingsRow
                label="Change Plan"
                onPress={handleChangePlan}
                right={
                  <MaterialIcons name="chevron-right" size={18} color={Secondary[400]} />
                }
              />
              <SettingsRow
                label="Cancel Subscription"
                onPress={handleCancelSubscription}
                right={
                  <Text className="text-base font-semibold text-red-500">
                    Cancel
                  </Text>
                }
              />
            </>
          ) : (
            /* Not premium (incl. signed out) — keep the paywall entry point. */
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
          )}
          <SettingsRow
            label="Night Mode"
            right={
              <Switch
                value={isDark}
                onValueChange={(val) => {
                  setPreference(val ? "dark" : "light");
                  toast.success(val ? "Night mode on" : "Night mode off");
                }}
              />
            }
          />

          <SettingsRow
            label="Test Language"
            right={
              <View className="flex-row items-center" style={{ gap: 14 }}>
                <RadioButton
                  selected={testLanguage === "en"}
                  onPress={() => handleTestLanguageChange("en")}
                  label="En"
                  isDark={isDark}
                />
                <RadioButton
                  selected={testLanguage === "es"}
                  onPress={() => handleTestLanguageChange("es")}
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
            onPress={() => requestAppRating()}
          />
          <ActionRow
            label="Report an Issue"
            icon="error-outline"
            onPress={() => reportAnIssue()}
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
        onConfirm={async () => {
          setResetModalVisible(false);
          try {
            // Wipe the real progress on the server (attempts + Challenge Bank) — the Progress bar
            // and pass counts are derived from these, so local-only clears left them unchanged.
            await resetAllResults();
          } catch {
            toast.error("Couldn't reset results — please try again");
            return;
          }
          resetProgress();
          clearChallengeBank();
          toast.success("All results have been reset");
        }}
        onCancel={() => setResetModalVisible(false)}
      />
    </SafeAreaView>
  );
}
