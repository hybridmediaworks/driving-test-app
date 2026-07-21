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
  NotebookText,
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
import NavMain from "./NavMain";
import UserMenu from "./UserMenu";

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutGrid, adminOnly: false },
  { title: "Browse Quizzes", href: "/quizzes", icon: ListChecks, adminOnly: false },
  { title: "Browse Flashcards", href: "/flashcards", icon: Copy, adminOnly: false },
  { title: "Browse Cheat Sheets", href: "/cheat-sheets", icon: NotebookText, adminOnly: false },
  { title: "My Results", href: "/dashboard/attempts", icon: ClipboardList, adminOnly: false },
  { title: "Quiz categories", href: "/admin/quiz-categories", icon: Layers, adminOnly: true },
  { title: "Quizzes", href: "/admin/quizzes", icon: Library, adminOnly: true },
  { title: "Flashcards", href: "/admin/flashcards", icon: Layers2, adminOnly: true },
  { title: "Cheat Sheets", href: "/admin/cheat-sheets", icon: NotebookText, adminOnly: true },
  { title: "User Management", href: "/admin/user-management", icon: UserRound, adminOnly: true },
  { title: "All Results", href: "/admin/attempts", icon: ClipboardCheck, adminOnly: true },
];

export default function AppSidebar() {
  const { user } = useAuth();
  const items = mainNavItems.filter((item) => !item.adminOnly || user?.is_admin);

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
        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
