/**
 * Cache layer with swappable backends
 * - In-memory (default): zero-config, works for single-instance deployments
 * - Redis (when REDIS_URL is set): for multi-instance horizontal scaling
 *
 * Both backends implement the same CacheBackend interface, so switching
 * is transparent to all consumers.
 *
 * Security hardening (2026-02-26):
 * - Real Redis backend via ioredis when REDIS_URL is configured
 * - In-memory fallback preserved for development / single-instance
 */

// ─── Interface ───────────────────────────────────────────────────────────────

export interface CacheBackend {
  get<T>(key: string): T | null | Promise<T | null>;
  set<T>(key: string, data: T, ttlMs: number): void | Promise<void>;
  invalidate(key: string): void | Promise<void>;
  invalidatePrefix(prefix: string): void | Promise<void>;
  invalidateAll(): void | Promise<void>;
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

// ─── Namespaced Cache Wrapper ───────────────────────────────────────────────
// Adds a namespace prefix to all keys for multi-tenant isolation.

class NamespacedCache implements CacheBackend {
  private backend: MemoryCache;
  private namespace: string;

  constructor(namespace = "ijar", maxEntries = 100_000) {
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

  invalidate(key: string): void {
    this.backend.invalidate(this.prefixKey(key));
  }

  invalidatePrefix(prefix: string): void {
    this.backend.invalidatePrefix(`${this.namespace}:${prefix}`);
  }

  invalidateAll(): void {
    this.backend.invalidateAll();
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

// ─── Redis Backend (requires ioredis) ───────────────────────────────────────
// Uses real Redis for distributed caching across multiple instances.
// Activated automatically when REDIS_URL environment variable is set.

let RedisCache: (new (redisUrl: string, namespace?: string) => CacheBackend) | null = null;

try {
  // Dynamic import check — ioredis may not be installed
  const ioredis = require("ioredis");

  class RedisCacheImpl implements CacheBackend {
    private client: InstanceType<typeof ioredis>;
    private namespace: string;
    private _size = 0;

    constructor(redisUrl: string, namespace = "ijar") {
      this.namespace = namespace;
      this.client = new ioredis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => Math.min(times * 200, 5000),
        lazyConnect: true,
        enableReadyCheck: true,
      });

      this.client.on("error", (err: Error) => {
        console.error("[Cache/Redis] Connection error:", err.message);
      });
      this.client.on("connect", () => {
        console.log("[Cache/Redis] Connected successfully");
      });

      // Connect asynchronously
      this.client.connect().catch((err: Error) => {
        console.error("[Cache/Redis] Initial connection failed:", err.message);
      });
    }

    private prefixKey(key: string): string {
      return `${this.namespace}:${key}`;
    }

    async get<T>(key: string): Promise<T | null> {
      try {
        const raw = await this.client.get(this.prefixKey(key));
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }

    async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
      try {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.client.setex(this.prefixKey(key), ttlSeconds, JSON.stringify(data));
        this._size++;
      } catch (err) {
        console.error("[Cache/Redis] SET error:", (err as Error).message);
      }
    }

    async invalidate(key: string): Promise<void> {
      try {
        await this.client.del(this.prefixKey(key));
      } catch {}
    }

    async invalidatePrefix(prefix: string): Promise<void> {
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
      } catch {}
    }

    async invalidateAll(): Promise<void> {
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
        this._size = 0;
      } catch {}
    }

    get size(): number {
      return this._size;
    }

    destroy(): void {
      this.client.disconnect();
    }
  }

  RedisCache = RedisCacheImpl as any;
} catch {
  // ioredis not installed — Redis backend unavailable
}

// ─── Factory & Singleton ─────────────────────────────────────────────────────

function createCache(): CacheBackend {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && RedisCache) {
    console.log("[Cache] REDIS_URL detected — using Redis distributed cache");
    return new RedisCache(redisUrl, "ijar");
  }
  if (redisUrl && !RedisCache) {
    console.warn("[Cache] REDIS_URL set but ioredis not installed. Run: npm install ioredis");
    console.warn("[Cache] Falling back to in-memory cache");
  } else {
    console.log("[Cache] Using in-memory cache (set REDIS_URL for distributed caching)");
  }
  return new NamespacedCache("ijar");
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
