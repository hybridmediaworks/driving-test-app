"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";

export default function VerifyEmailLinkPage({ params }: { params: Promise<{ id: string; hash: string }> }) {
  const { id, hash } = use(params);
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const query = searchParams.toString();

    api
      .get<{ message: string }>(`/email/verify/${id}/${hash}?${query}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
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
        {status === "success" && <div className="text-sm font-medium text-green-600">{message}</div>}
        {status === "error" && <div className="text-sm font-medium text-red-600">{message}</div>}

        {status !== "verifying" && (
          <Button href="/login" className="w-full justify-center">
            Continue to log in
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
