"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { useAuth, useLogout } from "@/lib/auth-context";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { logout, pending: loggingOut } = useLogout();
  const [processing, setProcessing] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user?.email_verified_at) router.replace("/");
  }, [user, router]);

  useEffect(() => {
    function recheck() {
      if (document.visibilityState === "visible") refreshUser();
    }

    document.addEventListener("visibilitychange", recheck);
    return () => document.removeEventListener("visibilitychange", recheck);
  }, [refreshUser]);

  async function resend() {
    setProcessing(true);
    try {
      await api.post("/email/verification-notification");
      setSent(true);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AuthLayout
      title="Verify email"
      description="Please verify your email address by clicking on the link we just emailed to you."
    >
      {sent && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          A new verification link has been sent to the email address you provided during registration.
        </div>
      )}

      <form className="space-y-6 text-center" onSubmit={(e) => e.preventDefault()}>
        <Button type="submit" className="w-full justify-center" disabled={processing} onClick={resend}>
          {processing && <Spinner />}
          Resend verification email
        </Button>

        <Button
          type="button"
          onClick={() => logout()}
          disabled={loggingOut}
          variant="ghost"
          size="sm"
          className="mx-auto p-0!"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </Button>
      </form>
    </AuthLayout>
  );
}
