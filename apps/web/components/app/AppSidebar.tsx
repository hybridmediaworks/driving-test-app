import { ClipboardList, LayoutGrid, Layers, Library, ListChecks, UserRound } from "lucide-react";
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
import AppLogo from "./AppLogo";
import NavMain from "./NavMain";
import UserMenu from "./UserMenu";

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { title: "Browse Quizzes", href: "/quizzes", icon: ListChecks },
  { title: "My Results", href: "/dashboard/attempts", icon: ClipboardList },
  { title: "Quiz categories", href: "/admin/quiz-categories", icon: Layers },
  { title: "Quizzes", href: "/admin/quizzes", icon: Library },
  { title: "User Management", href: "/admin/user-management", icon: UserRound },
];

export default function AppSidebar() {
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
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
