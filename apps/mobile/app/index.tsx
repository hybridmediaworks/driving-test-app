import { Redirect } from "expo-router";

import { useUserStore } from "@/store/userStore";

export default function Index() {
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);

  if (onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
