"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type NavChild = { title: string; href: string };
type NavItem = { title: string; href: string; icon: LucideIcon; children?: NavChild[] };
export type NavGroup = { label: string; items: NavItem[] };

// `useSearchParams` is the only thing that re-renders on a query-only navigation (children are
// distinguished by query string, e.g. ?vehicle_type=cdl). Its Suspense boundary lives here so no
// page rendering the sidebar needs one of its own; the fallback is the same nav with no query, so
// only the sub-item highlight waits for the real URL.
export default function NavMain({ groups }: { groups: NavGroup[] }) {
  return (
    <Suspense fallback={<NavList groups={groups} params={null} />}>
      <NavWithQuery groups={groups} />
    </Suspense>
  );
}

function NavWithQuery({ groups }: { groups: NavGroup[] }) {
  const params = useSearchParams();

  return <NavList groups={groups} params={params} />;
}

/** A child is active when the URL carries its query params — other params (page, status) may differ. */
function childIsActive(href: string, pathname: string, params: ReadonlyURLSearchParams | null) {
  const [path, query = ""] = href.split("?");
  if (path !== pathname) return false;
  if (params === null) return false;

  return [...new URLSearchParams(query)].every(([key, value]) => params.get(key) === value);
}

function NavList({ groups, params }: { groups: NavGroup[]; params: ReadonlyURLSearchParams | null }) {
  const pathname = usePathname();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="px-2 py-0">
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const onItemPath = pathname === item.href;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={onItemPath}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>

                  {item.children && onItemPath && (
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            isActive={childIsActive(child.href, pathname, params)}
                            render={<Link href={child.href} />}
                          >
                            <span>{child.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
