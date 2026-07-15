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
};

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new ApiError(res.status, data?.message ?? "Request failed", data?.errors);
    }

    return data as T;
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
