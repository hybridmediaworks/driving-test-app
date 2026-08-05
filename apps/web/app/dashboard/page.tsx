"use client";

import AppLayout from "@/components/app/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import LearnerDashboard from "@/components/dashboard/LearnerDashboard";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }]}>
      <div className="app-page flex h-full min-h-0 flex-1 flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {user?.is_admin ? <AdminDashboard /> : <LearnerDashboard />}
      </div>
    </AppLayout>
  );
}
