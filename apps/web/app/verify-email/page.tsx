"use client";

import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmailPage() {
  const { logout } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [sent, setSent] = useState(false);

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
          variant="ghost"
          size="sm"
          className="mx-auto p-0!"
        >
          Log out
        </Button>
      </form>
    </AuthLayout>
  );
}
