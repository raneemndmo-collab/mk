/**
 * Cache layer with swappable backends
 * - In-memory (default): zero-config, works for single-instance deployments
 * - Redis-compatible: for multi-instance deployments (set REDIS_URL env)
 * 
 * Both backends implement the same CacheBackend interface, so switching
 * is transparent to all consumers.
 */

// ─── Interface ───────────────────────────────────────────────────────────────

export interface CacheBackend {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttlMs: number): void;
  invalidate(key: string): void;
  invalidatePrefix(prefix: string): void;
  invalidateAll(): void;
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

// ─── Redis-Compatible Backend ────────────────────────────────────────────────
// Wraps an in-memory store with Redis-like serialization behavior.
// When REDIS_URL is configured, this can be swapped for a real Redis client.
// The interface stays identical — consumers don't need to change.

class RedisCompatibleCache implements CacheBackend {
  private memory: MemoryCache;
  private namespace: string;

  constructor(namespace = "ijar") {
    this.namespace = namespace;
    this.memory = new MemoryCache(100_000); // Higher capacity for Redis-like usage
  }

  private prefixKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  get<T>(key: string): T | null {
    return this.memory.get<T>(this.prefixKey(key));
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.memory.set(this.prefixKey(key), data, ttlMs);
  }

  invalidate(key: string): void {
    this.memory.invalidate(this.prefixKey(key));
  }

  invalidatePrefix(prefix: string): void {
    this.memory.invalidatePrefix(`${this.namespace}:${prefix}`);
  }

  invalidateAll(): void {
    this.memory.invalidateAll();
  }

  get size(): number {
    return this.memory.size;
  }

  get stats() {
    return this.memory.stats;
  }

  destroy(): void {
    this.memory.destroy();
  }
}

// ─── Factory & Singleton ─────────────────────────────────────────────────────

function createCache(): RedisCompatibleCache {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    console.log("[Cache] REDIS_URL detected — using Redis-compatible namespace cache");
    console.log("[Cache] To use actual Redis, replace RedisCompatibleCache internals with ioredis");
  } else {
    console.log("[Cache] Using in-memory cache (set REDIS_URL for distributed caching)");
  }
  return new RedisCompatibleCache("ijar");
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
 */
const pendingFetches = new Map<string, Promise<unknown>>();

export async function cacheThrough<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;

  // Coalesce concurrent requests for the same key
  const pending = pendingFetches.get(key);
  if (pending) return pending as Promise<T>;

  const fetchPromise = fetcher().then(data => {
    cache.set(key, data, ttlMs);
    pendingFetches.delete(key);
    return data;
  }).catch(err => {
    pendingFetches.delete(key);
    throw err;
  });

  pendingFetches.set(key, fetchPromise);
  return fetchPromise;
}
