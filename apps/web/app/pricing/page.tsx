"use client";

import { useEffect, useState } from "react";
import type { CheckoutResponse, Plan } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CTASection from "@/components/home/CTASection";
import FAQSection from "@/components/home/FAQSection";
import SuccessStories from "@/components/home/SuccessStories";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";

const FEATURES_BY_KEY: Record<string, string[]> = {
  free: ["Browse every quiz, cheat sheet, and flashcard deck", "Attempt all free (non-premium) practice tests", "Basic progress tracking"],
  weekly: [
    "Everything in Free, plus:",
    "Full premium question bank",
    "Exam Simulator — timed, DMV-style mock tests",
    "All cheat sheets & flashcard decks",
    "Ad-free",
    "Priority support",
    "Pass Guarantee eligible",
  ],
  monthly: [
    "Everything in Free, plus:",
    "Full premium question bank",
    "Exam Simulator — timed, DMV-style mock tests",
    "All cheat sheets & flashcard decks",
    "Ad-free",
    "Priority support",
    "Pass Guarantee eligible",
  ],
  lifetime_family: [
    "Everything in Monthly, for every seat",
    "One-time payment, no renewals",
    "Share access with your household",
    "Owner manages seats anytime",
  ],
};

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2 });
}

function priceSuffix(plan: Plan): string {
  if (plan.type === "one_time") return "one-time";
  return plan.billing_interval === "week" ? "/ week" : "/ month";
}

export default function Pricing() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkingOutKey, setCheckingOutKey] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: Plan[] }>("/plans")
      .then((res) => setPlans(res.data))
      .catch(() => setLoadError("Couldn't load plans right now. Please try again shortly."));
  }, []);

  async function handleCheckout(plan: Plan) {
    if (!user) {
      window.location.assign("/login");
      return;
    }
    setCheckoutError(null);
    setCheckingOutKey(plan.key);
    try {
      const res = await api.post<CheckoutResponse>("/billing/checkout", { plan_key: plan.key });
      window.location.assign(res.checkout_url);
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "Couldn't start checkout. Please try again.");
      setCheckingOutKey(null);
    }
  }

  function handleFreePlan() {
    window.location.assign(user ? "/dashboard" : "/register");
  }

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" />
        <main className="flex-1">
          <section className="py-15 md:space-y-15 lg:py-30">
            <div className="mx-auto max-w-container space-y-12 px-5">
              <div className="flex flex-col items-center justify-center gap-4 max-w-225 mx-auto">
                <Paragraph
                  className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
                  size="xs"
                  color="primary"
                >
                  ✦ Pricing
                </Paragraph>
                <Heading as="h1" className="text-center">
                  Start Free. Upgrade When You&apos;re Ready to Pass.
                </Heading>
                <Paragraph className="max-w-156 text-center" size="xl">
                  No contracts. Cancel anytime in a couple clicks.
                </Paragraph>
              </div>

              {loadError && <p className="text-center text-sm text-red-600">{loadError}</p>}
              {checkoutError && <p className="text-center text-sm text-red-600">{checkoutError}</p>}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                {(plans ?? []).map((plan) => {
                  const isPopular = plan.key === "monthly";
                  const isFree = plan.key === "free";
                  const isCheckingOut = checkingOutKey === plan.key;

                  return (
                    <div
                      key={plan.key}
                      className={`relative flex flex-col justify-between space-y-5 rounded-xl bg-white p-8 ${
                        isPopular
                          ? "border border-blue-600 shadow-[0_24px_50px_-26px_rgba(20,60,120,0.25),0_4px_6px_-2px_rgba(20,60,120,0.03)]"
                          : "border shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] lg:my-11.5"
                      }`}
                    >
                      <div className="space-y-5">
                        {isPopular && (
                          <div className="absolute left-0 flex w-full items-center justify-center -mt-11.5">
                            <Paragraph
                              className="rounded-full bg-linear-to-r from-blue-500 to-blue-700 px-3 pb-0.5 font-semibold"
                              color="white"
                            >
                              Most popular
                            </Paragraph>
                          </div>
                        )}
                        <Paragraph size="2xl" className="font-semibold mb-4" color="dark">
                          {plan.name}
                        </Paragraph>
                        <div className="mb-4 flex items-end gap-2">
                          <Heading as="h2">{formatPrice(plan.price_cents)}</Heading>
                          <Paragraph className="pb-2"> {priceSuffix(plan)} </Paragraph>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          {(FEATURES_BY_KEY[plan.key] ?? []).map((feature) => (
                            <Paragraph key={feature} className="flex items-start gap-2">
                              <Check className="mt-0.5 shrink-0 text-blue-500" />
                              <span>{feature}</span>
                            </Paragraph>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant={isPopular ? "primary" : "outline"}
                        className="w-full"
                        disabled={isCheckingOut}
                        onClick={isFree ? handleFreePlan : () => handleCheckout(plan)}
                      >
                        {isCheckingOut ? (
                          "Redirecting…"
                        ) : isFree ? (
                          "Start Free"
                        ) : (
                          <>
                            Get {plan.name} <ArrowRight />
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Paragraph size="sm" color="muted" className="text-center">
                Prices in USD. Pass Guarantee: full refund if you complete an Exam Simulator
                attempt and fail your official state knowledge test — see terms.
              </Paragraph>
            </div>
          </section>
          <FAQSection className="lg:pt-30 pt-15" />
          <SuccessStories className="pt-0 lg:pt-0 pb-15 lg:pb-30" />
          <CTASection />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
