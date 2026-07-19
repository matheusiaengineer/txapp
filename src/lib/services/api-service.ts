"use client";

const API_BASE = "/api";
const ROUTE_CACHE_KEY = "txd-route-cache";

interface ApiOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  cacheKey?: string;
}

interface ApiResponse<T = unknown> {
  status: "success" | "error";
  data?: T;
  error_message?: string;
}

function getRouteCache(): Record<string, { data: unknown; timestamp: number }> {
  try {
    const raw = localStorage.getItem(ROUTE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setRouteCache(cache: Record<string, { data: unknown; timestamp: number }>) {
  try {
    const keys = Object.keys(cache);
    if (keys.length > 5) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      delete cache[sorted[0]];
    }
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage may be full
  }
}

class ApiService {
  private controller: AbortController | null = null;

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    const { timeout = 30000, retries = 0, cacheKey, ...fetchOptions } = options;

    const etag = cacheKey ? localStorage.getItem(`etag-${cacheKey}`) : null;
    const cached = cacheKey ? localStorage.getItem(`cache-${cacheKey}`) : null;

    let attempt = 0;
    while (attempt <= retries) {
      this.controller = new AbortController();
      const timeoutId = setTimeout(() => this.controller?.abort(), timeout);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(fetchOptions.headers as Record<string, string>),
        };
        if (etag) headers["If-None-Match"] = etag;

        const res = await fetch(`${API_BASE}${endpoint}`, {
          ...fetchOptions,
          headers,
          signal: this.controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.status === 304 && cached) {
          return { status: "success", data: JSON.parse(cached) };
        }

        const resEtag = res.headers.get("ETag");
        if (resEtag && cacheKey) {
          localStorage.setItem(`etag-${cacheKey}`, resEtag);
        }

        const body = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            const { useUserStore } = await import("@/lib/store/user-store");
            useUserStore.getState().logout();
            window.location.href = "/auth/login?expired=1";
          }
          if (res.status === 500) {
            return { status: "error", error_message: "Erro interno do servidor. Tente novamente mais tarde." };
          }
          return { status: "error", error_message: body.error_message || "Erro no servidor" };
        }

        if (cacheKey && fetchOptions.method === undefined) {
          localStorage.setItem(`cache-${cacheKey}`, JSON.stringify(body));
        }

        if (endpoint.startsWith("/addresses") && fetchOptions.method === undefined) {
          const routeCache = getRouteCache();
          routeCache[endpoint] = { data: body, timestamp: Date.now() };
          setRouteCache(routeCache);
        }

        return { status: "success", data: body };
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          return { status: "error", error_message: "Tempo limite excedido" };
        }

        attempt++;
        if (attempt > retries) {
          return { status: "error", error_message: "Erro de conexão" };
        }

        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    return { status: "error", error_message: "Falha na requisição" };
  }

  get<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) });
  }

  put<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {},
      timeout: 60000,
    });
  }

  abort() {
    this.controller?.abort();
  }
}

export const api = new ApiService();
