/**
 * Low-level HTTP client for Beds24 API V2.
 * Automatically attaches Bearer token and retries on 401.
 */

import { Beds24TokenManager } from "./token-manager.js";

export interface Beds24ClientConfig {
  apiUrl: string;
  refreshToken: string;
}

export class Beds24Client {
  private readonly tokenManager: Beds24TokenManager;
  private readonly baseUrl: string;

  constructor(config: Beds24ClientConfig) {
    this.baseUrl = config.apiUrl;
    this.tokenManager = new Beds24TokenManager(config.apiUrl, config.refreshToken);
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options?: {
      query?: Record<string, string>;
      body?: unknown;
      retryOn401?: boolean;
    }
  ): Promise<{ status: number; data: T }> {
    const token = await this.tokenManager.getAccessToken();
    const url = new URL(`${this.baseUrl}${path}`);

    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        url.searchParams.set(k, v);
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    // Retry once on 401
    if (res.status === 401 && (options?.retryOn401 ?? true)) {
      this.tokenManager.invalidate();
      return this.request<T>(method, path, { ...options, retryOn401: false });
    }

    const data = res.headers.get("content-type")?.includes("application/json")
      ? ((await res.json()) as T)
      : ((await res.text()) as unknown as T);

    return { status: res.status, data };
  }

  get<T = unknown>(path: string, query?: Record<string, string>) {
    return this.request<T>("GET", path, { query });
  }

  post<T = unknown>(path: string, body?: unknown) {
    return this.request<T>("POST", path, { body });
  }

  put<T = unknown>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, { body });
  }

  delete<T = unknown>(path: string) {
    return this.request<T>("DELETE", path);
  }
}
