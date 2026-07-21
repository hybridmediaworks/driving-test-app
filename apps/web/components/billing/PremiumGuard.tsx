"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth, useEntitlement } from "@/lib/auth-context";

export default function PremiumGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isPremium } = useEntitlement();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isPremium) {
      router.replace("/pricing");
    }
  }, [loading, isPremium, router]);

  if (loading || !user || !isPremium) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        {!loading && !isPremium ? "This page requires an active plan." : "Loading…"}
      </div>
    );
  }

  return <>{children}</>;
}
