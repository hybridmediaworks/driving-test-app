import { Avatar, AvatarFallback } from "@/components/ui/Avatar";

function getInitials(fullName?: string): string {
  if (!fullName) return "";
  const names = fullName.trim().split(" ");
  if (names.length === 0) return "";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

export default function UserInfo({
  user,
  showEmail = false,
}: {
  user: { name: string; email: string };
  showEmail?: boolean;
}) {
  return (
    <>
      <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
        <AvatarFallback>
          <span className="text-black">{getInitials(user.name)}</span>
        </AvatarFallback>
      </Avatar>

      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
      </div>
    </>
  );
}
