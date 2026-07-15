"use client";

import AppLayout from "@/components/app/AppLayout";
import PlaceholderPattern from "@/components/ui/PlaceholderPattern";

export default function DashboardPage() {
  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }]}>
      <div className="app-page flex h-full min-h-0 flex-1 rounded-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
            <PlaceholderPattern />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
            <PlaceholderPattern />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70">
            <PlaceholderPattern />
          </div>
        </div>
        <div className="relative min-h-[36vh] flex-1 rounded-xl border border-sidebar-border/70 md:min-h-[20rem]">
          <PlaceholderPattern />
        </div>
      </div>
    </AppLayout>
  );
}
