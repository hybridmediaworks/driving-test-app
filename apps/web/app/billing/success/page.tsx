"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { MySubscription } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";

const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 2000;

export default function BillingSuccessPage() {
  const [status, setStatus] = useState<"checking" | "confirmed" | "pending">("checking");
  const attemptsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      while (!cancelled && attemptsRef.current < POLL_ATTEMPTS) {
        attemptsRef.current += 1;
        try {
          const subscription = await api.get<MySubscription>("/billing/subscription");
          if (subscription.is_premium) {
            if (!cancelled) setStatus("confirmed");
            return;
          }
        } catch {
          // keep polling — a transient error here shouldn't end the wait early
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (!cancelled) setStatus("pending");
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-lg space-y-4 px-5 py-20 text-center">
            {status === "checking" && <Paragraph color="muted">Confirming your purchase…</Paragraph>}

            {status === "confirmed" && (
              <>
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                <h1 className="text-2xl font-semibold text-neutral-900">You&apos;re all set</h1>
                <Paragraph color="muted">Your plan is active. Enjoy full access.</Paragraph>
                <Button href="/dashboard">Go to dashboard</Button>
              </>
            )}

            {status === "pending" && (
              <>
                <h1 className="text-2xl font-semibold text-neutral-900">Almost there</h1>
                <Paragraph color="muted">
                  Your payment is still being confirmed — this can take a minute. Check your dashboard shortly, or
                  refresh this page.
                </Paragraph>
                <Button href="/dashboard">Go to dashboard</Button>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
