"use client";

import {
  ClipboardCheck,
  ClipboardList,
  Copy,
  LayoutGrid,
  Layers,
  Layers2,
  Library,
  ListChecks,
  type LucideIcon,
  NotebookText,
  Receipt,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import AppLogo from "./AppLogo";
import NavMain, { type NavGroup } from "./NavMain";
import UserMenu from "./UserMenu";

type PlatformNavItem = { title: string; href: string; icon: LucideIcon; learnerOnly?: boolean };

// `learnerOnly` items are dropped from an admin's Platform section — for things that only make
// sense for someone using the product as a student (e.g. filing a refund claim against their own
// subscription). Tag new items here rather than special-casing them in the filter below.
const platformNavItems: PlatformNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { title: "Browse Quizzes", href: "/quizzes", icon: ListChecks },
  { title: "Browse Flashcards", href: "/flashcards", icon: Copy },
  { title: "Browse Cheat Sheets", href: "/cheat-sheets", icon: NotebookText },
  { title: "My Results", href: "/dashboard/attempts", icon: ClipboardList },
  { title: "Pass Guarantee", href: "/pass-guarantee", icon: ShieldCheck, learnerOnly: true },
];

const adminNavItems = [
  { title: "Quiz categories", href: "/admin/quiz-categories", icon: Layers },
  { title: "Quizzes", href: "/admin/quizzes", icon: Library },
  { title: "Flashcards", href: "/admin/flashcards", icon: Layers2 },
  { title: "Cheat Sheets", href: "/admin/cheat-sheets", icon: NotebookText },
  { title: "User Management", href: "/admin/user-management", icon: UserRound },
  { title: "All Results", href: "/admin/attempts", icon: ClipboardCheck },
  { title: "Pass Guarantee Claims", href: "/admin/pass-guarantee-claims", icon: Receipt },
];

export default function AppSidebar() {
  const { user } = useAuth();

  const platformItems = platformNavItems.filter((item) => !item.learnerOnly || !user?.is_admin);

  const groups: NavGroup[] = [
    { label: "Platform", items: platformItems },
    ...(user?.is_admin ? [{ label: "Admin", items: adminNavItems }] : []),
  ];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <AppLogo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
