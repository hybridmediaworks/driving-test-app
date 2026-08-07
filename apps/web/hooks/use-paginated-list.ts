"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.delete("page");
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    },
    [searchParams, router, pathname],
  );

  const setPage = useCallback((newPage: number) => updateFilter("page", String(newPage)), [updateFilter]);

  return { searchParams, filterQuery, page, updateFilter, setPage };
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
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);

  const reload = useCallback(() => {
    if (path === null) return;
    const separator = path.includes("?") ? "&" : "?";
    api.get<PaginatedResponse<T>>(`${path}${separator}page=${page}`).then(setData);
  }, [path, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, reload };
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
