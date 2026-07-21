import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import type { User } from "@driving-test-app/shared";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import UserInfo from "./UserInfo";

/**
 * The account dropdown's contents (identity header, settings link, logout) — shared by every
 * trigger that opens it, in-app sidebar and public marketing header alike, so the account menu
 * only needs to be built once.
 */
export default function AccountMenuItems({ user }: { user: User }) {
  const { logout } = useAuth();

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserInfo user={user} showEmail />
          </div>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem render={<Link href="/settings/profile" className="block w-full cursor-pointer" />}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => logout()}>
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </>
  );
}
