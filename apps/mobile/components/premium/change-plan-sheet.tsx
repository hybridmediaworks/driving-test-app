import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Primary, Secondary, White } from "@/constants/theme";
import { useIsDark } from "@/hooks/use-is-dark";
import * as Purchases from "@/services/purchases";
import { useAuthStore } from "@/store/authStore";
import { usePlanStore } from "@/store/planStore";
import { toast } from "@/store/toastStore";
import type { Plan } from "@driving-test-app/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEAL = "#2DD4BF";

// Shared NativeWind classes so the sheet follows the app theme (Settings → Night Mode).
const TITLE_TEXT = "text-secondary-900 dark:text-secondary-50";
const MUTED_TEXT = "text-secondary-500 dark:text-secondary-400";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  });
}

// Same suffix logic the web pricing page uses.
function priceSuffix(plan: Plan): string {
  if (plan.type === "one_time") return "one-time";
  return plan.billing_interval === "week" ? "/ week" : "/ month";
}

/**
 * Settings → "Change Plan" sheet. Lists the same plans the web pricing page shows (GET /plans) so an
 * existing subscriber can switch. Standalone copy of the paywall's TrialSheet so its copy can be
 * tuned without touching the onboarding paywall.
 */
export function ChangePlanSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const isDark = useIsDark();
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const plans = usePlanStore((s) => s.plans);
  const plansLoading = usePlanStore((s) => s.loading);
  const plansError = usePlanStore((s) => s.error);
  const fetchPlans = usePlanStore((s) => s.fetchPlans);

  // The plan the user is already on — derived from their entitlement tier. That card is shown
  // disabled so they can't "switch" to the plan they already have.
  const currentPlanKey = useAuthStore((s) => {
    switch (s.user?.entitlement?.tier) {
      case "weekly_subscriber":
        return "weekly";
      case "monthly_subscriber":
        return "monthly";
      case "lifetime_family_owner":
      case "lifetime_family_member":
        return "lifetime_family";
      default:
        return null;
    }
  });

  const [busy, setBusy] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sort_order - b.sort_order),
    [plans],
  );
  // Default highlight: "monthly" (matches the web page's "Most popular"), but never the plan the
  // user is already on — fall back to the first plan that isn't their current one.
  const activeKey =
    selectedKey ??
    (currentPlanKey !== "monthly"
      ? sortedPlans.find((p) => p.key === "monthly")?.key
      : undefined) ??
    sortedPlans.find((p) => p.key !== currentPlanKey)?.key ??
    null;
  const selectedPlan = sortedPlans.find((p) => p.key === activeKey) ?? null;

  const handleSubscribe = async () => {
    // Expo Go / missing keys: real store purchases need a dev/prod build configured with RevenueCat.
    if (!Purchases.isAvailable()) {
      toast.info("Subscriptions open in the full app build — coming soon here.");
      return;
    }
    setBusy(true);
    try {
      const { cancelled, isPremium } = await Purchases.purchase();
      if (cancelled) return;
      if (isPremium) {
        onClose();
        toast.success("You're Premium — enjoy full access! 🎉");
      } else {
        toast.error("Purchase didn't complete — please try again.");
      }
    } catch {
      toast.error("Couldn't complete the purchase. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!Purchases.isAvailable()) {
      toast.info("Restore is available in the full app build.");
      return;
    }
    setBusy(true);
    try {
      const { isPremium } = await Purchases.restore();
      onClose();
      toast[isPremium ? "success" : "info"](
        isPremium
          ? "Premium restored — welcome back! 🎉"
          : "No previous purchase found to restore.",
      );
    } catch {
      toast.error("Couldn't restore purchases. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: visible ? 0 : 600,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 200 : 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const buttonLabel = busy
    ? "Please wait…"
    : selectedPlan?.trial_days
      ? `Start ${selectedPlan.trial_days}-day free trial`
      : selectedPlan
        ? `Switch to ${selectedPlan.name}`
        : "Continue";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              opacity: fadeAnim,
            }}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: isDark ? Secondary[900] : White.DEFAULT,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? Secondary[700] : Secondary[300],
              marginBottom: 20,
            }}
          />

          {plans.length === 0 ? (
            plansLoading ? (
              <ActivityIndicator color={TEAL} style={{ paddingVertical: 40 }} />
            ) : (
              <Text className={`text-center py-10 ${MUTED_TEXT}`}>
                {plansError ?? "No plans available right now."}
              </Text>
            )
          ) : (
            <>
              <Heading level="h3" color="default" className="text-center mb-6">
                Update Plans
              </Heading>

              <View>
                {sortedPlans.map((plan) => {
                  const isCurrent = plan.key === currentPlanKey;
                  const selected = !isCurrent && plan.key === activeKey;
                  const popular = plan.key === "monthly";
                  return (
                    <TouchableOpacity
                      key={plan.key}
                      activeOpacity={0.8}
                      disabled={isCurrent}
                      onPress={() => setSelectedKey(plan.key)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        opacity: isCurrent ? 0.5 : 1,
                        borderWidth: 1.5,
                        borderColor: selected
                          ? Primary.DEFAULT
                          : isDark
                            ? Secondary[700]
                            : Secondary[200],
                        backgroundColor: selected
                          ? isDark
                            ? Secondary[800]
                            : Primary[50]
                          : "transparent",
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      {isCurrent ? (
                        <MaterialIcons
                          name="check-circle"
                          size={22}
                          color={Secondary[400]}
                        />
                      ) : (
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            borderWidth: 2,
                            borderColor: selected
                              ? Primary.DEFAULT
                              : Secondary[400],
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selected && (
                            <View
                              style={{
                                width: 11,
                                height: 11,
                                borderRadius: 6,
                                backgroundColor: Primary.DEFAULT,
                              }}
                            />
                          )}
                        </View>
                      )}

                      <View style={{ flex: 1, flexShrink: 1 }}>
                        <View className="flex-row items-center" style={{ gap: 8 }}>
                          <Text className={`font-bold text-base ${TITLE_TEXT}`}>
                            {plan.name}
                          </Text>
                          {isCurrent ? (
                            <Text
                              style={{
                                color: isDark ? Secondary[400] : Secondary[500],
                              }}
                              className="text-[11px] font-bold uppercase"
                            >
                              Current plan
                            </Text>
                          ) : popular ? (
                            <Text
                              style={{ color: TEAL }}
                              className="text-[11px] font-bold uppercase"
                            >
                              Popular
                            </Text>
                          ) : null}
                        </View>
                        <Text className={`text-xs mt-0.5 ${MUTED_TEXT}`}>
                          {plan.trial_days
                            ? `${plan.trial_days}-day free trial, then ${formatPrice(plan.price_cents)} ${priceSuffix(plan)}`
                            : `Billed ${priceSuffix(plan)}`}
                        </Text>
                      </View>

                      <View
                        style={{
                          alignItems: "flex-end",
                          flexShrink: 0,
                          minWidth: 72,
                        }}
                      >
                        <Text className={`font-bold text-base ${TITLE_TEXT}`}>
                          {formatPrice(plan.price_cents)}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className={`text-xs mt-0.5 ${MUTED_TEXT}`}
                        >
                          {priceSuffix(plan)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className={`text-center text-xs mt-2 ${MUTED_TEXT}`}>
                Prices in USD. Cancel anytime.
              </Text>

              <Button
                variant="primary"
                size="lg"
                showArrow={!busy}
                disabled={busy || !selectedPlan || selectedPlan.key === currentPlanKey}
                className="w-full mt-3"
                onPress={handleSubscribe}
              >
                {buttonLabel}
              </Button>

              <View className="flex-row justify-center items-center gap-1.5 mt-3">
                <MaterialIcons
                  name="verified-user"
                  size={14}
                  color={isDark ? Secondary[400] : Secondary[500]}
                />
                <Text className={`text-xs ${MUTED_TEXT}`}>
                  Secured with Google Play
                </Text>
              </View>

              <View className="flex-row justify-center gap-5 mt-3">
                <Text className={`text-xs ${MUTED_TEXT}`}>Terms &amp; Privacy</Text>
                <TouchableOpacity onPress={handleRestore} disabled={busy}>
                  <Text className={`text-xs ${MUTED_TEXT}`}>Restore</Text>
                </TouchableOpacity>
                <Text className={`text-xs ${MUTED_TEXT}`}>Pass Guarantee</Text>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
