export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  getToken: () => string | null | Promise<string | null>;
  // Anonymous-caller identity, sent as `X-Guest-Token` whenever there's no auth token — lets the
  // backend resume an in-progress quiz attempt for a guest across page reloads. Optional: a client
  // that never calls it (e.g. mobile, for now) just never sends the header.
  getGuestToken?: () => string | null | Promise<string | null>;
  // Per-attempt request timeout in ms. A hung request is aborted and retried (if retriable) rather
  // than leaving the caller waiting forever. Default 20s — generous enough for a slow submit.
  timeoutMs?: number;
  // How many extra attempts to make on a transient failure (network drop, timeout, 5xx, 429).
  // Default 2 (so up to 3 attempts total). Non-transient failures (4xx validation, auth) never retry.
  maxRetries?: number;
};

// Gateway/availability statuses: the request did not get processed, so a quick retry is safe.
// 429 (rate limited) is intentionally excluded — retrying within a short backoff just adds load to
// an already-throttled window; the caller surfaces it to the user to wait instead.
const RETRIABLE_STATUS = new Set([408, 425, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAbortError = (err: unknown): boolean =>
  err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");

export function createApiClient({
  baseUrl,
  getToken,
  getGuestToken,
  timeoutMs = 20000,
  maxRetries = 2,
}: ApiClientOptions) {
  // Decide whether a failed attempt is worth retrying. Network/timeout errors and transient server
  // statuses are retried; a 500 is only retried for idempotent methods so a POST can't create a
  // duplicate resource (e.g. a second quiz attempt) if it actually succeeded server-side.
  function isRetriable(err: unknown, method: string): boolean {
    if (err instanceof ApiError) {
      // These statuses mean the server did not process the request, so retrying can't duplicate work.
      if (RETRIABLE_STATUS.has(err.status)) return true;
      return err.status === 500 && method !== "POST";
    }
    // Network failure or aborted (timed-out) fetch: the request MAY have reached the server. Only
    // retry idempotent methods — auto-retrying a POST could create a duplicate resource (e.g. a
    // second quiz attempt) if the first actually succeeded but its response was lost.
    return method !== "POST";
  }

  async function attempt<T>(
    path: string,
    options: RequestInit,
    headers: Record<string, string>,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new ApiError(res.status, data?.message ?? "Request failed", data?.errors);
      }
      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const guestToken = token ? null : await getGuestToken?.();
    const isFormData = options.body instanceof FormData;
    const method = (options.method ?? "GET").toUpperCase();

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
      ...(options.headers as Record<string, string>),
    };

    let lastError: unknown;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await attempt<T>(path, options, headers);
      } catch (err) {
        lastError = err;
        if (i === maxRetries || !isRetriable(err, method)) {
          // Surface an aborted (timed-out) request as a clear, typed error instead of a raw
          // DOMException, so callers can message it like any other failure.
          if (isAbortError(err)) {
            throw new ApiError(408, "The request timed out. Please check your connection and try again.");
          }
          throw err;
        }
        // Linear backoff (0.4s, 0.8s, …) to let a transient blip clear before retrying.
        await sleep(400 * (i + 1));
      }
    }
    throw lastError;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
    delete: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
  };
}
