"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  consumePendingCheckoutPlan,
  setPendingCheckoutPlan,
} from "@/lib/pendingCheckout";
import { WebLayoutProvider } from "@/lib/web-layout-context";

const FEATURES_BY_KEY: Record<string, string[]> = {
  weekly: [
    "Full premium question bank",
    "Exam Simulator — timed, DMV-style mock tests",
    "All cheat sheets & flashcard decks",
    "Ad-free",
    "Priority support",
    "Pass Guarantee eligible",
  ],
  monthly: [
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
  return (priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  });
}

function priceSuffix(plan: Plan): string {
  if (plan.type === "one_time") return "one-time";
  return plan.billing_interval === "week" ? "/ week" : "/ month";
}

function PricingInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkingOutKey, setCheckingOutKey] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // Set once we've auto-resumed the checkout named by ?checkout=, so we don't re-trigger it on
  // every render/param change. A ref, not state — it's an internal guard, not something the UI
  // renders from, so it doesn't need to (and per the set-state-in-effect lint rule, shouldn't)
  // trigger a re-render.
  const resumedCheckout = useRef(false);

  useEffect(() => {
    api
      .get<{ data: Plan[] }>("/plans")
      .then((res) => setPlans(res.data))
      .catch(() =>
        setLoadError(
          "Couldn't load plans right now. Please try again shortly.",
        ),
      );
  }, []);

  async function handleCheckout(plan: Plan) {
    if (!user) {
      // Covers the login/register detour (URL param) and the email-verification-link detour
      // (localStorage, since that link is server-generated and can't carry our own params).
      setPendingCheckoutPlan(plan.key);
      const resumeUrl = `/pricing?checkout=${plan.key}`;
      window.location.assign(
        `/login?redirect=${encodeURIComponent(resumeUrl)}`,
      );
      return;
    }
    // Actually checking out now — clear any stale pending marker so it can't get replayed later.
    consumePendingCheckoutPlan();
    setCheckoutError(null);
    setCheckingOutKey(plan.key);
    try {
      const res = await api.post<CheckoutResponse>("/billing/checkout", {
        plan_key: plan.key,
      });
      window.location.assign(res.checkout_url);
    } catch (err) {
      setCheckoutError(
        err instanceof ApiError
          ? err.message
          : "Couldn't start checkout. Please try again.",
      );
      setCheckingOutKey(null);
    }
  }

  // Resumes a checkout started before an auth detour (see handleCheckout above and
  // app/login|register's `redirect` param): once the user is authenticated and plans are
  // loaded, fire the checkout for the plan named by ?checkout= exactly once, then strip the
  // param so a refresh or back-navigation doesn't re-trigger it.
  useEffect(() => {
    if (resumedCheckout.current || authLoading || !user || !plans) return;
    const checkoutKey = searchParams.get("checkout");
    if (!checkoutKey) return;

    resumedCheckout.current = true;
    router.replace("/pricing");

    // Deferred to a microtask: handleCheckout sets state as its first step (checkingOutKey,
    // checkoutError), and calling that synchronously within an effect body risks cascading
    // renders — same reason resumedCheckout above is a ref, not state.
    queueMicrotask(() => {
      const plan = plans.find((p) => p.key === checkoutKey);
      if (plan) void handleCheckout(plan);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, plans, searchParams]);

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
                  Simple Pricing. Cancel Anytime.
                </Heading>
                <Paragraph className="max-w-156 text-center" size="xl">
                  No contracts. Cancel anytime in a couple clicks.
                </Paragraph>
              </div>

              {loadError && (
                <p className="text-center text-sm text-red-600">{loadError}</p>
              )}
              {checkoutError && (
                <p className="text-center text-sm text-red-600">
                  {checkoutError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                {(plans ?? []).map((plan) => {
                  const isPopular = plan.key === "monthly";
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
                        <Paragraph
                          size="2xl"
                          className="font-semibold mb-4"
                          color="dark"
                        >
                          {plan.name}
                        </Paragraph>
                        <div className="mb-4 flex items-end gap-2">
                          <Heading as="h2">
                            {formatPrice(plan.price_cents)}
                          </Heading>
                          <Paragraph className="pb-2">
                            {" "}
                            {priceSuffix(plan)}{" "}
                          </Paragraph>
                        </div>
                        {plan.trial_days && (
                          <Paragraph
                            size="sm"
                            color="primary"
                            className="font-semibold"
                          >
                            {plan.trial_days}-day free trial, then{" "}
                            {formatPrice(plan.price_cents)} {priceSuffix(plan)}
                          </Paragraph>
                        )}
                        <Separator />
                        <div className="space-y-2">
                          {(FEATURES_BY_KEY[plan.key] ?? []).map((feature) => (
                            <Paragraph
                              key={feature}
                              className="flex items-start gap-2"
                            >
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
                        onClick={() => handleCheckout(plan)}
                      >
                        {isCheckingOut ? (
                          "Redirecting…"
                        ) : plan.trial_days ? (
                          <>
                            Start {plan.trial_days}-Day Free Trial{" "}
                            <ArrowRight />
                          </>
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
                Prices in USD. Pass Guarantee: full refund if you complete an
                Exam Simulator attempt and fail your official state knowledge
                test — see terms.
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

export default function Pricing() {
  return (
    <Suspense>
      <PricingInner />
    </Suspense>
  );
}
