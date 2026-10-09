"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginatedResponse } from "@driving-test-app/shared";
import { api, ApiError } from "@/lib/api";

/**
 * Single source of truth for a list page's URL-persisted state: current page number plus any
 * filters, all as query params on the page's own URL — not local component state — so a given
 * page/filter combination is shareable, survives a refresh, and works with browser back/forward.
 * `page` always lives at the `page` query param; every other key is a caller-defined filter.
 * Changing a filter resets `page` back to 1 (an old page number rarely stays valid against a new
 * filter); changing only the page leaves every filter untouched.
 *
 * Requires a Suspense boundary above it (`useSearchParams()`'s own requirement) — wrap the page's
 * default export in `<Suspense>`, matching every other page that already reads search params.
 */
export function useUrlQuery() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1") || 1;

  // Everything except `page` — the query string to hand to a list endpoint alongside a separately
  // appended `page=`, so callers never end up with two conflicting `page` params in one URL.
  const filterParams = new URLSearchParams(searchParams.toString());
  filterParams.delete("page");
  const filterQuery = filterParams.toString();

  /**
   * Applies several filters in one navigation. Calling `updateFilter` in a loop cannot do this:
   * every call reads the same `searchParams` from the render it was created in, so each one would
   * build its URL from the original query string and only the last would survive.
   */
  const updateFilters = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      if (!("page" in patch)) params.delete("page");
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    },
    [searchParams, router, pathname],
  );

  const updateFilter = useCallback((key: string, value: string) => updateFilters({ [key]: value }), [updateFilters]);

  const setPage = useCallback((newPage: number) => updateFilter("page", String(newPage)), [updateFilter]);

  return { searchParams, filterQuery, page, updateFilter, updateFilters, setPage };
}

/**
 * Fetches a bare paginated list endpoint (`{data, links, meta}`) and refetches whenever `path` or
 * `page` changes. `page` is owned by the caller — pass `useUrlQuery()`'s `page` so it stays
 * URL-persisted; this hook only fetches, it doesn't decide what page it's on. For composite
 * responses (a paginated list nested alongside sibling keys like filter dropdown options), fetch
 * manually with `useUrlQuery()` for the URL-state part instead — this is only for the common
 * single-resource case.
 *
 * Deliberately never builds a `next/link` href from the API's own `meta.links[].url` — those are
 * absolute URLs on the API's own origin (Laravel's paginator builds them from APP_URL), and this
 * app authenticates with a Bearer token, not cookies, so a raw browser navigation to that URL
 * can't attach it and 401s. Always go through the authenticated `api` client instead, driven by a
 * plain page number (see `components/ui/Paginator.tsx`).
 */
export function usePaginatedList<T>(path: string | null, page: number) {
  // The response is kept alongside the URL it answered, which is what makes `loading` derivable
  // rather than another piece of state: a request is in flight exactly when the newest response
  // on hand answered a different URL than the one being asked for now. Without that distinction a
  // list page cannot tell "still loading" from "nothing matched", and briefly renders its empty
  // state over results that are on their way — which is what a filtered URL did on first paint.
  const [result, setResult] = useState<{ url: string; data: PaginatedResponse<T> } | null>(null);
  // Only the newest request may write. Typing in a search box fires one per keystroke and they
  // don't come back in order, so a slower early response could otherwise land last and replace
  // the results for what was actually typed.
  const latestRequest = useRef(0);

  const url = path === null ? null : `${path}${path.includes("?") ? "&" : "?"}page=${page}`;

  const reload = useCallback(() => {
    if (url === null) return;
    const requestId = ++latestRequest.current;
    api.get<PaginatedResponse<T>>(url).then((res) => {
      if (requestId === latestRequest.current) setResult({ url, data: res });
    });
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  // The previous response stays available while the next one loads, so a page can dim what is
  // already on screen instead of blanking it.
  return { data: result?.data ?? null, loading: url !== null && result?.url !== url, reload };
}

/**
 * Shared delete-confirmation-dialog state (target/open/error) used by every admin list page —
 * pass the delete call itself, this owns the open/close/error bookkeeping around it.
 */
export function useDeleteConfirm<T>(deleteItem: (item: T) => Promise<void>, onDeleted: () => void, fallbackMessage = "Failed to delete.") {
  const [target, setTarget] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function request(item: T) {
    setTarget(item);
    setError(null);
    setOpen(true);
  }

  async function confirm() {
    if (!target) return;
    try {
      await deleteItem(target);
      setOpen(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : fallbackMessage);
    }
  }

  return { target, open, setOpen, error, request, confirm };
}
