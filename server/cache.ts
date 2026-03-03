/**
 * Cache layer with swappable backends
 * - Redis (when REDIS_URL is set): distributed cache for multi-instance deployments
 * - In-memory (default): zero-config fallback for single-instance / development
 *
 * Both backends implement the same CacheBackend interface, so switching
 * is transparent to all consumers.
 *
 * Graceful degradation: if Redis connection fails at runtime, operations
 * silently fall back to in-memory and log errors (never crash).
 */

import Redis from "ioredis";

// ─── Interface ───────────────────────────────────────────────────────────────

export interface CacheBackend {
  get<T>(key: string): T | null | Promise<T | null>;
  set<T>(key: string, data: T, ttlMs: number): void | Promise<void>;
  /** Alias for invalidate — matches the spec's delete(key) requirement */
  delete(key: string): void | Promise<void>;
  invalidate(key: string): void | Promise<void>;
  invalidatePrefix(prefix: string): void | Promise<void>;
  invalidateAll(): void | Promise<void>;
  /** Alias for invalidateAll — matches the spec's flush() requirement */
  flush(): void | Promise<void>;
  /** Cache-aside pattern: get from cache or fetch + store */
  getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T>;
  get size(): number;
  destroy(): void;
}

// ─── In-Memory Backend ───────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache implements CacheBackend {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private maxEntries: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(maxEntries = 50_000) {
    this.maxEntries = maxEntries;
    // Cleanup expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 30_000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.missCount++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.missCount++;
      return null;
    }
    this.hitCount++;
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // Evict oldest entries if at capacity (LRU-like)
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOldest(Math.floor(this.maxEntries * 0.1)); // Evict 10%
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    const keys = Array.from(this.store.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.store.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  flush(): void {
    this.invalidateAll();
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const data = await fetchFn();
    this.set(key, data, ttlMs);
    return data;
  }

  get size(): number {
    return this.store.size;
  }

  /** Cache hit ratio for monitoring */
  get stats() {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(1) + "%" : "N/A",
      entries: this.store.size,
      maxEntries: this.maxEntries,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private evictOldest(count: number): void {
    const now = Date.now();
    let evicted = 0;
    // First pass: evict expired entries
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        evicted++;
        if (evicted >= count) return;
      }
    }
    // Second pass: evict entries closest to expiry
    if (evicted < count) {
      const sorted = Array.from(this.store.entries())
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      for (const [key] of sorted) {
        if (evicted >= count) break;
        this.store.delete(key);
        evicted++;
      }
    }
  }
}

// ─── Redis Backend ──────────────────────────────────────────────────────────
// Uses ioredis for distributed caching across multiple Railway instances.
// Activated automatically when REDIS_URL environment variable is set.
// Graceful degradation: if Redis is unreachable, operations return null/void
// and log errors without crashing.

class RedisBackend implements CacheBackend {
  private client: Redis;
  private namespace: string;
  private fallback: MemoryCache;
  private _connected = false;

  constructor(redisUrl: string, namespace = "mk") {
    this.namespace = namespace;
    this.fallback = new MemoryCache(50_000);

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error("[Cache/Redis] Max retries exceeded — giving up reconnection");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 5000);
      },
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 10_000,
      commandTimeout: 5_000,
    });

    this.client.on("error", (err: Error) => {
      if (this._connected) {
        console.error("[Cache/Redis] Connection lost:", err.message);
        this._connected = false;
      }
    });
    this.client.on("connect", () => {
      console.log("[Cache/Redis] Connected successfully");
      this._connected = true;
    });
    this.client.on("close", () => {
      if (this._connected) {
        console.warn("[Cache/Redis] Connection closed");
        this._connected = false;
      }
    });

    // Connect asynchronously — don't block startup
    this.client.connect().catch((err: Error) => {
      console.error("[Cache/Redis] Initial connection failed:", err.message);
      console.warn("[Cache/Redis] Falling back to in-memory cache until Redis reconnects");
    });
  }

  private prefixKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this._connected) return this.fallback.get<T>(key);
    try {
      const raw = await this.client.get(this.prefixKey(key));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error("[Cache/Redis] GET error:", (err as Error).message);
      return this.fallback.get<T>(key);
    }
  }

  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    // Always write to fallback for graceful degradation
    this.fallback.set(key, data, ttlMs);
    if (!this._connected) return;
    try {
      const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
      await this.client.setex(this.prefixKey(key), ttlSeconds, JSON.stringify(data));
    } catch (err) {
      console.error("[Cache/Redis] SET error:", (err as Error).message);
    }
  }

  async delete(key: string): Promise<void> {
    return this.invalidate(key);
  }

  async invalidate(key: string): Promise<void> {
    this.fallback.invalidate(key);
    if (!this._connected) return;
    try {
      await this.client.del(this.prefixKey(key));
    } catch (err) {
      console.error("[Cache/Redis] DEL error:", (err as Error).message);
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    this.fallback.invalidatePrefix(prefix);
    if (!this._connected) return;
    try {
      const pattern = `${this.namespace}:${prefix}*`;
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error("[Cache/Redis] INVALIDATE_PREFIX error:", (err as Error).message);
    }
  }

  async invalidateAll(): Promise<void> {
    this.fallback.invalidateAll();
    if (!this._connected) return;
    try {
      const pattern = `${this.namespace}:*`;
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error("[Cache/Redis] FLUSH error:", (err as Error).message);
    }
  }

  async flush(): Promise<void> {
    return this.invalidateAll();
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const data = await fetchFn();
    await this.set(key, data, ttlMs);
    return data;
  }

  get size(): number {
    // Approximate — returns fallback size since Redis DBSIZE is async
    return this.fallback.size;
  }

  destroy(): void {
    this.fallback.destroy();
    this.client.disconnect();
  }
}

// ─── Namespaced Cache Wrapper (for in-memory only) ──────────────────────────
// Adds a namespace prefix to all keys for multi-tenant isolation.

class NamespacedCache implements CacheBackend {
  private backend: MemoryCache;
  private namespace: string;

  constructor(namespace = "mk", maxEntries = 100_000) {
    this.namespace = namespace;
    this.backend = new MemoryCache(maxEntries);
  }

  private prefixKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  get<T>(key: string): T | null {
    return this.backend.get<T>(this.prefixKey(key));
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.backend.set(this.prefixKey(key), data, ttlMs);
  }

  delete(key: string): void {
    this.backend.invalidate(this.prefixKey(key));
  }

  invalidate(key: string): void {
    this.backend.invalidate(this.prefixKey(key));
  }

  invalidatePrefix(prefix: string): void {
    this.backend.invalidatePrefix(`${this.namespace}:${prefix}`);
  }

  invalidateAll(): void {
    this.backend.invalidateAll();
  }

  flush(): void {
    this.backend.invalidateAll();
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    const data = await fetchFn();
    this.set(key, data, ttlMs);
    return data;
  }

  get size(): number {
    return this.backend.size;
  }

  get stats() {
    return this.backend.stats;
  }

  destroy(): void {
    this.backend.destroy();
  }
}

// ─── Factory & Singleton ─────────────────────────────────────────────────────

function createCache(): CacheBackend {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    console.log("[Cache] REDIS_URL detected — using Redis distributed cache");
    return new RedisBackend(redisUrl, "mk");
  }
  console.warn("[Cache] ⚠ Redis not configured — using in-memory cache. Not suitable for multi-instance deployments.");
  return new NamespacedCache("mk");
}

export const cache = createCache();

// ─── TTL Constants (milliseconds) ────────────────────────────────────────────

export const CACHE_TTL = {
  SETTINGS: 60_000,         // 1 minute — site settings rarely change
  PROPERTY_COUNTS: 30_000,  // 30 seconds — counts can be slightly stale
  HOMEPAGE_DATA: 60_000,    // 1 minute — featured properties, cities
  CITY_LIST: 300_000,       // 5 minutes — cities/districts rarely change
  PROPERTY_DETAIL: 15_000,  // 15 seconds — individual property pages
  SEARCH_RESULTS: 10_000,   // 10 seconds — search results
  ANALYTICS: 120_000,       // 2 minutes — admin analytics
  USER_COUNT: 60_000,       // 1 minute
} as const;

// ─── Key Generators ──────────────────────────────────────────────────────────

export const CACHE_KEYS = {
  settings: () => 'settings:all',
  settingsSingle: (key: string) => `settings:${key}`,
  propertyCount: (status?: string) => `property:count:${status || 'all'}`,
  userCount: () => 'user:count',
  bookingCount: (status?: string) => `booking:count:${status || 'all'}`,
  featuredCities: () => 'cities:featured',
  allCities: (activeOnly: boolean) => `cities:all:${activeOnly}`,
  districts: (city: string) => `districts:${city}`,
  propertyDetail: (id: number) => `property:${id}`,
  searchResults: (hash: string) => `search:${hash}`,
  homepageStats: () => 'homepage:stats',
  analytics: (key: string) => `analytics:${key}`,
} as const;

// ─── Cache-Through Helper ────────────────────────────────────────────────────

/**
 * Get from cache or fetch from DB. Thread-safe for concurrent requests
 * to the same key (first request fetches, others wait).
 * Supports both sync (MemoryCache) and async (Redis) backends.
 */
const pendingFetches = new Map<string, Promise<unknown>>();

export async function cacheThrough<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await Promise.resolve(cache.get<T>(key));
  if (cached !== null) return cached;

  // Coalesce concurrent requests for the same key
  const pending = pendingFetches.get(key);
  if (pending) return pending as Promise<T>;

  const fetchPromise = fetcher().then(async data => {
    await Promise.resolve(cache.set(key, data, ttlMs));
    pendingFetches.delete(key);
    return data;
  }).catch(err => {
    pendingFetches.delete(key);
    throw err;
  });

  pendingFetches.set(key, fetchPromise);
  return fetchPromise;
}
