"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

/**
 * Renders its children only for a visitor who isn't signed in. Wraps the state hub's acquisition
 * sections — the pitch, the social proof, the closing call to action — which a learner who already
 * has an account has, by definition, already responded to; for them the page should get on with
 * showing their study path.
 *
 * Applied at the page level rather than inside the sections themselves, because several of them
 * (the "Learn Your Way" band, the closing CTA) are shared with the marketing home page, where they
 * should keep rendering for everyone.
 *
 * Nothing renders while auth is still resolving, so a signed-in learner never sees these flash in
 * and disappear.
 */
export default function SignedOutOnly({ children }: { children: ReactNode }) {
  return useIsSignedOut() ? <>{children}</> : null;
}

/**
 * The same test, for layout that has to react to those sections being gone rather than just
 * hiding itself — see the phase ladder's top padding, which exists only to clear the live-stats
 * card overlapping into it.
 */
export function useIsSignedOut(): boolean {
  const { user, loading } = useAuth();
  return !loading && !user;
}
