import { useCallback, useEffect, useState } from "react";
import type { PaginatedResponse } from "@driving-test-app/shared";
import { api, ApiError } from "@/lib/api";

/**
 * Fetches a bare paginated list endpoint (`{data, links, meta}`) and refetches whenever `path`
 * changes. For composite responses (e.g. a paginated list nested alongside sibling keys like
 * filter dropdown options), fetch manually instead — this is only for the common single-resource
 * case.
 */
export function usePaginatedList<T>(path: string | null) {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);

  const reload = useCallback(() => {
    if (path === null) return;
    api.get<PaginatedResponse<T>>(path).then(setData);
  }, [path]);

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
