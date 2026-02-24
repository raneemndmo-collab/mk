/**
 * Beds24 API V2 Token Manager
 * Handles server-side token refresh — no tokens in browser.
 * Reference: Beds24 API V2 authentication docs
 */

interface TokenState {
  accessToken: string;
  expiresAt: number; // epoch ms
}

export class Beds24TokenManager {
  private state: TokenState | null = null;
  private refreshPromise: Promise<string> | null = null;
  private readonly apiUrl: string;
  private readonly refreshToken: string;

  constructor(apiUrl: string, refreshToken: string) {
    this.apiUrl = apiUrl;
    this.refreshToken = refreshToken;
  }

  /** Get a valid access token, refreshing if needed. */
  async getAccessToken(): Promise<string> {
    if (this.state && Date.now() < this.state.expiresAt - 60_000) {
      return this.state.accessToken;
    }
    // Coalesce concurrent refresh requests
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<string> {
    const res = await fetch(`${this.apiUrl}/api/v2/authentication/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Beds24 token refresh failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { token: string; expiresIn?: number };
    const expiresIn = data.expiresIn ?? 3600;

    this.state = {
      accessToken: data.token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return this.state.accessToken;
  }

  /** Force-clear cached token (e.g. after 401). */
  invalidate(): void {
    this.state = null;
  }
}
