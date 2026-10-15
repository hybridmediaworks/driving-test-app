import { NextResponse, type NextRequest } from "next/server";
import { isAllowedUnverified } from "@/lib/emailVerificationGate";

export function proxy(request: NextRequest) {
  if (isAllowedUnverified(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/verify-email", request.url));
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|.*\\..*).*)",
      has: [{ type: "cookie", key: "email_unverified" }],
    },
  ],
};
