"use client";

import { use, useEffect, useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { api, ApiError } from "@/lib/api";

export default function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .post<{ message: string }>(`/newsletter/unsubscribe/${token}`, {})
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "That unsubscribe link is invalid.");
      });
  }, [token]);

  return (
    <AuthLayout title="Unsubscribe" description="">
      <div className="space-y-6 text-center">
        {status === "processing" && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Spinner /> Unsubscribing you…
          </div>
        )}
        {status === "success" && <div className="text-sm font-medium text-green-600">{message}</div>}
        {status === "error" && <div className="text-sm font-medium text-red-600">{message}</div>}

        {(status === "success" || status === "error") && (
          <Button href="/" className="w-full justify-center">
            Back to home
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
