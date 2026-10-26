"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api, ApiError, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { consumePendingCheckoutPlan } from "@/lib/pendingCheckout";

export default function VerifyEmailLinkPage({ params }: { params: Promise<{ id: string; hash: string }> }) {
  const { id, hash } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "resuming-checkout" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const query = searchParams.toString();

    api
      .get<{ message: string; checkout_plan?: string | null }>(`/email/verify/${id}/${hash}?${query}`)
      .then(async (res) => {
        await refreshUser();

        // A guest who was mid-checkout before this email detour left their chosen plan here
        // (see app/pricing's handleCheckout) — now verified, so checkout is allowed; send them
        // straight back to it instead of a generic "now log in" dead end. The server's copy covers
        // a link opened in another browser, where this one's localStorage is empty; there /pricing
        // asks them to log in first and then carries on to checkout.
        const pendingPlanKey = consumePendingCheckoutPlan() ?? res.checkout_plan ?? null;
        if (pendingPlanKey) {
          setStatus("resuming-checkout");
          const checkoutUrl = `/pricing?checkout=${pendingPlanKey}`;
          // Not signed in in this browser: checkout needs an account, so log in first and land
          // straight back in it (the same redirect /pricing itself uses for a guest).
          window.location.assign(getToken() ? checkoutUrl : `/login?redirect=${encodeURIComponent(checkoutUrl)}`);
          return;
        }

        setStatus("success");
        router.replace("/");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hash]);

  return (
    <AuthLayout title="Email verification" description="">
      <div className="space-y-6 text-center">
        {status === "verifying" && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Spinner /> Verifying your email…
          </div>
        )}
        {status === "resuming-checkout" && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Spinner /> Verified — taking you back to checkout…
          </div>
        )}
        {status === "success" && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Spinner /> Verified — taking you to the homepage…
          </div>
        )}
        {status === "error" && (
          <>
            <div className="text-sm font-medium text-red-600">{message}</div>
            <Button href="/login" className="w-full justify-center">
              Continue to log in
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
