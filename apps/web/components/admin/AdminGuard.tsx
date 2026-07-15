"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (!user.is_admin) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || !user.is_admin) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        {!loading && user && !user.is_admin ? "You don't have access to this page." : "Loading…"}
      </div>
    );
  }

  return <>{children}</>;
}
