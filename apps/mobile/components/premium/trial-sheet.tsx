import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Primary } from "@/constants/theme";
import * as Purchases from "@/services/purchases";
import { usePlanStore } from "@/store/planStore";
import { toast } from "@/store/toastStore";
import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
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

const NAVY_BG = Primary[1000];
const MUTED = "rgba(255,255,255,0.55)";
const TEAL = "#2DD4BF";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function TrialSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const plans = usePlanStore((s) => s.plans);
  const plansLoading = usePlanStore((s) => s.loading);
  const plansError = usePlanStore((s) => s.error);
  const fetchPlans = usePlanStore((s) => s.fetchPlans);

  const [busy, setBusy] = useState(false);

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
        isPremium ? "Premium restored — welcome back! 🎉" : "No previous purchase found to restore.",
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

  // Weekly is the only plan with a trial (see PlanSeeder) — everything below is derived from its
  // real price/trial_days rather than hardcoded, so this sheet stays correct if pricing changes.
  const trialPlan = plans.find((p) => p.trial_days != null);
  const daysInInterval = trialPlan?.billing_interval === "month" ? 30 : 7;
  const perDayCents = trialPlan ? Math.round(trialPlan.price_cents / daysInInterval) : 0;
  const intervalLabel = trialPlan?.billing_interval === "month" ? "month" : "week";

  const STEPS = trialPlan
    ? [
        {
          icon: <MaterialCommunityIcons name="lock-open-outline" size={18} color={TEAL} />,
          title: `Today: Get a ${trialPlan.trial_days}-day free trial`,
          subtitle: "Unlimited access to Premium",
        },
        {
          icon: <MaterialCommunityIcons name="bell-outline" size={18} color={TEAL} />,
          title: `Day ${(trialPlan.trial_days ?? 1) - 1}: We'll remind you`,
          subtitle: "We'll let you know your trial is about to end",
        },
        {
          icon: <FontAwesome5 name="gem" size={15} color={TEAL} />,
          title: `Day ${(trialPlan.trial_days ?? 0) + 1}: Your subscription begins`,
          subtitle: "Unless you cancel at least 24 hours before it starts",
        },
      ]
    : [];

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
          backgroundColor: NAVY_BG,
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
            backgroundColor: "rgba(255,255,255,0.3)",
            marginBottom: 20,
          }}
        />

        {plansLoading && !trialPlan ? (
          <ActivityIndicator color={TEAL} style={{ paddingVertical: 40 }} />
        ) : !trialPlan ? (
          <Text style={{ color: MUTED }} className="text-center py-10">
            {plansError ?? "Unable to load trial details."}
          </Text>
        ) : (
          <>
            <Heading level="h3" color="white" className="text-center mb-6">
              How your Free Trial works
            </Heading>

            <View>
              {STEPS.map((step, i) => (
                <View key={step.title} style={{ flexDirection: "row" }}>
                  <View style={{ alignItems: "center", width: 44 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        borderWidth: 1.5,
                        borderColor: TEAL,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {step.icon}
                    </View>
                    {i < STEPS.length - 1 && (
                      <View
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 24,
                          backgroundColor: "rgba(255,255,255,0.15)",
                          marginVertical: 4,
                        }}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingLeft: 12, paddingBottom: i < STEPS.length - 1 ? 18 : 0 }}>
                    <Text className="text-white font-bold text-base">{step.title}</Text>
                    <Text style={{ color: MUTED }} className="text-sm mt-0.5">
                      {step.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View
              style={{
                borderWidth: 1,
                borderColor: Primary.DEFAULT,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <View>
                <Text className="text-white font-bold text-base">
                  {trialPlan.trial_days} days free
                </Text>
                <Text style={{ color: MUTED }} className="text-xs mt-0.5">
                  then {formatPrice(trialPlan.price_cents)} / {intervalLabel}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text className="text-white font-bold text-base">
                  {formatPrice(perDayCents)}
                </Text>
                <Text style={{ color: MUTED }} className="text-xs mt-0.5">
                  per day
                </Text>
              </View>
            </View>

            <Text style={{ color: MUTED }} className="text-center text-xs mt-4">
              No payment required now, easy to cancel
            </Text>

            <Button
              variant="primary"
              size="lg"
              showArrow={!busy}
              disabled={busy}
              className="w-full mt-3"
              onPress={handleSubscribe}
            >
              {busy ? "Please wait…" : "Try for $0.00"}
            </Button>

            <View className="flex-row justify-center items-center gap-1.5 mt-3">
              <MaterialIcons name="verified-user" size={14} color={MUTED} />
              <Text style={{ color: MUTED }} className="text-xs">
                Secured with Google Play
              </Text>
            </View>

            <View className="flex-row justify-center gap-5 mt-3">
              <Text style={{ color: MUTED }} className="text-xs">
                Terms &amp; Privacy
              </Text>
              <TouchableOpacity onPress={handleRestore} disabled={busy}>
                <Text style={{ color: MUTED }} className="text-xs">
                  Restore
                </Text>
              </TouchableOpacity>
              <Text style={{ color: MUTED }} className="text-xs">
                Pass Guarantee
              </Text>
            </View>
          </>
        )}
        </Animated.View>
      </View>
    </Modal>
  );
}
