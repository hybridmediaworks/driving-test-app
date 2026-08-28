import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export type AsyncStatus = "loading" | "error" | "success";

export type AsyncState<T> = {
  status: AsyncStatus;
  data: T | undefined;
  error: unknown;
  /** Re-run the async function. Flips status back to "loading" while it's in flight. */
  refetch: () => void;
};

type Options = {
  /** When false, the function isn't run and status settles to "success" so no loader shows. */
  enabled?: boolean;
  /** Re-run every time the screen regains focus (tab screens), instead of only on mount/deps. */
  refetchOnFocus?: boolean;
};

/**
 * One place for the "load async data, track loading/error, allow retry" pattern every data screen
 * repeats. Handles cancellation (a resolve/reject after unmount or a deps change is ignored) and
 * exposes `refetch` for the error state's retry button.
 *
 * Pass `refetchOnFocus` for tab screens that should re-pull fresh data whenever the user returns to
 * them; otherwise it runs on mount and whenever `deps` change. `enabled: false` (e.g. gated on auth)
 * skips the call entirely and reports "success" with `undefined` data, so the screen can render its
 * own gate instead of a spinner.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: DependencyList,
  options: Options = {},
): AsyncState<T> {
  const { enabled = true, refetchOnFocus = false } = options;

  const [state, setState] = useState<{ status: AsyncStatus; data?: T; error?: unknown }>({
    status: enabled ? "loading" : "success",
    data: undefined,
    error: undefined,
  });

  // Bumped by refetch() to force a re-run without changing the caller's deps.
  const [nonce, setNonce] = useState(0);

  // Keep the latest fn without making it a dependency — callers pass an inline closure that changes
  // every render, so we depend on the explicit `deps` array instead (same contract as useEffect).
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    if (!enabled) {
      setState({ status: "success", data: undefined, error: undefined });
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading", error: undefined }));
    fnRef.current().then(
      (data) => {
        if (!cancelled) setState({ status: "success", data, error: undefined });
      },
      (error) => {
        if (!cancelled) setState((prev) => ({ status: "error", data: prev.data, error }));
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps]);

  // Mount/deps path — active only when we're NOT driving off focus.
  useEffect(() => {
    if (refetchOnFocus) return;
    return run();
  }, [run, refetchOnFocus]);

  // Focus path — re-runs on focus and whenever `run` changes (deps/nonce) while focused.
  useFocusEffect(
    useCallback(() => {
      if (!refetchOnFocus) return;
      return run();
    }, [run, refetchOnFocus]),
  );

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { status: state.status, data: state.data, error: state.error, refetch };
}
