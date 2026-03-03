/**
 * JWT Token Blacklist
 *
 * Enables server-side token revocation for stateless JWT sessions.
 * When a user logs out, their token is added to the blacklist.
 * On every authenticated request, the token is checked against the blacklist.
 *
 * Backends:
 * - Redis: tokens survive container restarts (multi-instance safe)
 * - In-memory: fallback when Redis is unavailable (single-instance only)
 *
 * Tokens are stored with the same TTL as the JWT expiry, so they
 * auto-expire from the blacklist when the JWT itself would have expired.
 */

import Redis from "ioredis";
import { createHash } from "crypto";

// ─── Interface ───────────────────────────────────────────────────────────────

interface TokenBlacklistBackend {
  /** Add a token to the blacklist. ttlMs = remaining lifetime of the JWT. */
  add(token: string, ttlMs: number): Promise<void>;
  /** Check if a token is blacklisted. */
  isBlacklisted(token: string): Promise<boolean>;
  /** Remove all blacklisted tokens (for testing/admin). */
  clear(): Promise<void>;
  destroy(): void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Hash the token before storing to avoid keeping raw JWTs in Redis.
 * SHA-256 is fast and collision-resistant for this purpose.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── In-Memory Backend ───────────────────────────────────────────────────────

class MemoryBlacklist implements TokenBlacklistBackend {
  private store = new Map<string, number>(); // hash → expiresAt
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.store.entries());
      for (const [hash, expiresAt] of entries) {
        if (now > expiresAt) this.store.delete(hash);
      }
    }, 60_000);
  }

  async add(token: string, ttlMs: number): Promise<void> {
    const hash = hashToken(token);
    this.store.set(hash, Date.now() + ttlMs);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const hash = hashToken(token);
    const expiresAt = this.store.get(hash);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.store.delete(hash);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ─── Redis Backend ───────────────────────────────────────────────────────────

class RedisBlacklist implements TokenBlacklistBackend {
  private client: Redis;
  private fallback: MemoryBlacklist;
  private namespace: string;
  private _connected = false;

  constructor(redisUrl: string, namespace = "mk:bl") {
    this.namespace = namespace;
    this.fallback = new MemoryBlacklist();

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(times * 200, 5000);
      },
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 10_000,
      commandTimeout: 5_000,
    });

    this.client.on("error", (err: Error) => {
      if (this._connected) {
        console.error("[TokenBlacklist/Redis] Connection lost:", err.message);
        this._connected = false;
      }
    });
    this.client.on("connect", () => {
      console.log("[TokenBlacklist/Redis] Connected successfully");
      this._connected = true;
    });
    this.client.on("close", () => {
      if (this._connected) {
        console.warn("[TokenBlacklist/Redis] Connection closed");
        this._connected = false;
      }
    });

    this.client.connect().catch((err: Error) => {
      console.error("[TokenBlacklist/Redis] Initial connection failed:", err.message);
      console.warn("[TokenBlacklist/Redis] Falling back to in-memory blacklist");
    });
  }

  private prefixKey(hash: string): string {
    return `${this.namespace}:${hash}`;
  }

  async add(token: string, ttlMs: number): Promise<void> {
    const hash = hashToken(token);
    // Always write to fallback for graceful degradation
    await this.fallback.add(token, ttlMs);

    if (!this._connected) return;
    try {
      const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
      await this.client.setex(this.prefixKey(hash), ttlSec, "1");
    } catch (err) {
      console.error("[TokenBlacklist/Redis] ADD error:", (err as Error).message);
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const hash = hashToken(token);

    if (!this._connected) return this.fallback.isBlacklisted(token);
    try {
      const exists = await this.client.exists(this.prefixKey(hash));
      return exists === 1;
    } catch (err) {
      console.error("[TokenBlacklist/Redis] CHECK error:", (err as Error).message);
      return this.fallback.isBlacklisted(token);
    }
  }

  async clear(): Promise<void> {
    await this.fallback.clear();
    if (!this._connected) return;
    try {
      const pattern = `${this.namespace}:*`;
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) await this.client.del(...keys);
      } while (cursor !== "0");
    } catch (err) {
      console.error("[TokenBlacklist/Redis] CLEAR error:", (err as Error).message);
    }
  }

  destroy(): void {
    this.fallback.destroy();
    this.client.disconnect();
  }
}

// ─── Factory & Singleton ─────────────────────────────────────────────────────

function createBlacklist(): TokenBlacklistBackend {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    console.log("[TokenBlacklist] REDIS_URL detected — using Redis token blacklist");
    return new RedisBlacklist(redisUrl, "mk:bl");
  }
  console.warn("[TokenBlacklist] ⚠ Redis not configured — using in-memory blacklist. Revoked tokens will not survive restarts.");
  return new MemoryBlacklist();
}

export const tokenBlacklist = createBlacklist();
