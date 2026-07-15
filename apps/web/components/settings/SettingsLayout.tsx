"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppLayout from "@/components/app/AppLayout";
import { Separator } from "@/components/ui/separator";
import HeadingSmall from "./HeadingSmall";

const navItems = [
  { title: "Profile", href: "/settings/profile" },
  { title: "Security", href: "/settings/security" },
  { title: "Appearance", href: "/settings/appearance" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AppLayout breadcrumbs={[{ title: "Settings", href: "/settings/profile" }]}>
      <div className="app-page">
        <HeadingSmall title="Settings" description="Manage your profile and account settings" />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-0 lg:space-x-12">
          <aside className="w-full max-w-full lg:w-48 lg:max-w-none">
            <nav
              className="-mx-1 flex flex-row gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0"
              aria-label="Settings"
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex shrink-0 items-center justify-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-blue-500 transition-opacity hover:opacity-90 lg:w-full ${
                      isActive ? "bg-muted" : ""
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <Separator className="lg:hidden" />

          <div className="min-w-0 flex-1 lg:max-w-2xl">
            <section className="w-full max-w-xl space-y-10 sm:space-y-12">{children}</section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
