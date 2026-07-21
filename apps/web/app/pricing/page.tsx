"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
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

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" />
        <main className="flex-1">
          <section className="py-15 md:space-y-15 lg:py-30">
            <div className="mx-auto max-w-container space-y-12 px-5">
              <div className="mx-auto flex max-w-225 flex-col items-center justify-center gap-4">
                <Paragraph
                  className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
                  size="xs"
                  color="primary"
                >
                  ✦ Pricing
                </Paragraph>
                <Heading as="h1" className="text-center">
                  Simple pricing. Pick how you pay.
                </Heading>
                <Paragraph className="max-w-156 text-center" size="xl">
                  Start free, upgrade when you&apos;re ready to make test day a formality. No contracts. Cancel anytime.
                </Paragraph>
              </div>

              {loadError && <p className="text-center text-sm text-destructive">{loadError}</p>}
              {checkoutError && <p className="text-center text-sm text-destructive">{checkoutError}</p>}
              {!plans && !loadError && <p className="text-center text-sm text-neutral-500">Loading plans…</p>}

              {plans && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                  {plans.map((plan) => {
                    const isMonthly = plan.key === "monthly";
                    const features = FEATURES_BY_KEY[plan.key] ?? [];

                    return (
                      <div
                        key={plan.key}
                        className={
                          isMonthly
                            ? "relative space-y-5 rounded-xl border border-blue-600 bg-white p-8 shadow-[0_24px_50px_-26px_rgba(20,60,120,0.25),0_4px_6px_-2px_rgba(20,60,120,0.03)]"
                            : "flex flex-col justify-between space-y-5 rounded-xl border bg-white p-8 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] lg:my-11.5"
                        }
                      >
                        {isMonthly && (
                          <div className="absolute left-0 -mt-11.5 flex w-full items-center justify-center">
                            <Paragraph
                              className="rounded-full bg-linear-to-r from-blue-500 to-blue-700 px-3 pb-0.5 font-semibold"
                              color="white"
                            >
                              Most popular
                            </Paragraph>
                          </div>
                        )}
                        <div className="space-y-5">
                          <Paragraph size="2xl" className="mb-4 font-semibold" color="dark">
                            {plan.name}
                          </Paragraph>
                          <div className="mb-4 flex items-end gap-2">
                            <Heading as="h2">{formatPrice(plan.price_cents)}</Heading>
                            <Paragraph className="pb-2"> {priceSuffix(plan)} </Paragraph>
                          </div>
                          {plan.key === "lifetime_family" && (
                            <Paragraph size="sm" color="muted">
                              Up to {plan.max_seats} seats — invite your household after purchase.
                            </Paragraph>
                          )}
                          <Separator />
                          <div className="space-y-2">
                            {features.map((feature) => (
                              <Paragraph key={feature} className="flex items-start gap-2">
                                <Check className="mt-0.5 text-blue-500" />
                                <span>{feature}</span>
                              </Paragraph>
                            ))}
                          </div>
                        </div>
                        {plan.key === "free" ? (
                          <Button href={user ? "/dashboard" : "/register"} variant="outline" className="w-full rounded-[8px]!">
                            {user ? "Go to dashboard" : "Start Free"}
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            disabled={checkingOutKey === plan.key}
                            onClick={() => handleCheckout(plan)}
                          >
                            {checkingOutKey === plan.key ? "Redirecting…" : (
                              <>
                                Get {plan.name} <ArrowRight />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Paragraph size="sm" color="muted" className="text-center">
                Prices in USD. Pass Guarantee: full refund if you complete an Exam Simulator attempt on an active plan and
                still don&apos;t pass your official test — see terms.
              </Paragraph>
            </div>
          </section>
          <FAQSection className="pt-15 lg:pt-30" />
          <SuccessStories className="pt-0 pb-15 lg:pt-0 lg:pb-30" />
          <CTASection />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
