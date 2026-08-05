"use client";

import { ChevronDown } from "lucide-react";
import type { User } from "@driving-test-app/shared";
import AccountMenuItems from "@/components/app/AccountMenuItems";
import UserInfo from "@/components/app/UserInfo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * Account dropdown for the public marketing header — same menu contents as the in-app sidebar's
 * UserMenu, but with a plain pill trigger instead of one wired to sidebar collapse state.
 */
export default function PublicAccountMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex h-11.5 items-center gap-2 rounded-full bg-neutral-100 py-1 pr-3 pl-1 text-base font-medium text-neutral-700 transition-shadow hover:shadow-md" />
        }
      >
        <UserInfo user={user} />
        <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" align="end" sideOffset={8}>
        <AccountMenuItems user={user} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
