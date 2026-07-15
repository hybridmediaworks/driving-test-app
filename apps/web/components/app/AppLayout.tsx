"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import AppSidebar from "./AppSidebar";
import AppSidebarHeader from "./AppSidebarHeader";

type BreadcrumbItem = { title: string; href: string };

export default function AppLayout({
  breadcrumbs = [],
  children,
}: {
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.email_verified_at) {
      router.replace("/verify-email");
    }
  }, [loading, user, router]);

  if (loading || !user || !user.email_verified_at) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <AppSidebarHeader breadcrumbs={breadcrumbs} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
