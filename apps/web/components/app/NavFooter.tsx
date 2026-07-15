import type { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = { title: string; href: string; icon: LucideIcon };

export default function NavFooter({ items, className = "" }: { items: NavItem[]; className?: string }) {
  return (
    <SidebarGroup className={`group-data-[collapsible=icon]:p-0 ${className}`}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="text-neutral-600 hover:text-neutral-800"
                render={<a href={item.href} target="_blank" rel="noopener noreferrer" />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
