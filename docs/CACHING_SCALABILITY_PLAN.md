# MonthlyKey — Caching & Scalability Plan

**Version:** 2.0  
**Date:** 2026-02-26  
**Classification:** Internal — Engineering & Infrastructure  
**Compliance note:** No Beds24 changes. No Mansun dependency added.

---

## 1. Executive Summary

MonthlyKey currently uses in-memory `Map`-based caching and rate limiting. This architecture works for a single-instance deployment but breaks under horizontal scaling: each instance maintains its own cache and rate-limit counters, leading to stale data, inconsistent rate enforcement, and wasted memory. This plan specifies the migration from in-memory stores to Redis, enabling multi-instance deployments without application changes. The migration is designed to be incremental — each component can be migrated independently with a feature flag fallback.

---

## 2. Current Architecture Analysis

### 2.1 In-Memory Cache (`server/cache.ts`)

The cache implementation uses a JavaScript `Map` with TTL-based expiration:

```typescript
// Current implementation (simplified)
const store = new Map<string, { value: any; expiresAt: number }>();

export function cacheThrough<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const cached = store.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.value;
  const value = await fn();
  store.set(key, { value, expiresAt: Date.now() + ttl });
  return value;
}
```

The cache stores site settings (60s TTL), property search results, and various computed values. The `cache.clear()` function is called when admin settings are updated, but this only clears the local instance's cache.

### 2.2 In-Memory Rate Limiter (`server/rate-limiter.ts`)

The rate limiter uses a `Map` keyed by IP address with sliding window counters:

```typescript
// Current implementation (simplified)
const attempts = new Map<string, { count: number; resetAt: number }>();
```

Rate limit configuration:

| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| Auth (login/register) | 5 minutes | 10 |
| OTP send | 5 minutes | 5 |
| OTP verify | 5 minutes | 10 |
| General API | 1 minute | 100 |

The rate limiter resets on every deploy, which on Railway happens multiple times per day during active development.

### 2.3 Permission Cache (`server/permissions.ts`)

Admin permissions are cached for 60 seconds in a separate `Map`:

```typescript
const permissionCache = new Map<number, { permissions: string[]; isRoot: boolean; expiresAt: number }>();
```

### 2.4 Problems with Current Architecture

| Problem | Impact | Scenario |
|---------|--------|----------|
| **Cache inconsistency** | Users see stale data | Admin updates settings on Instance A; Instance B serves old cached values for up to 60s |
| **Rate limit bypass** | Security degradation | Attacker distributes requests across instances; each instance counts independently |
| **Memory pressure** | OOM crashes | Large cache entries (search results, property lists) accumulate without bound |
| **Deploy reset** | Rate limit bypass | Every Railway deploy clears all counters; attacker times attacks around deploys |
| **No cache metrics** | Blind optimization | No visibility into hit rates, miss rates, or eviction patterns |

---

## 3. Target Architecture: Redis

### 3.1 Redis Service Setup

Redis is deployed as a separate Railway service within the same project. The connection URL is provided via the `REDIS_URL` environment variable.

**Recommended Redis configuration:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| `maxmemory` | 256MB | Sufficient for cache + rate limiting + sessions |
| `maxmemory-policy` | `allkeys-lru` | Evict least-recently-used keys when memory is full |
| `appendonly` | `no` | Cache data is ephemeral; persistence not needed |
| `timeout` | 300 | Close idle connections after 5 minutes |

### 3.2 Redis Client Module

**New file:** `server/redis.ts`

```typescript
import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (client && client.isReady) return client;
  
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[Redis] REDIS_URL not set — falling back to in-memory cache");
    return null as any; // Handled by feature flag in callers
  }
  
  client = createClient({ url });
  client.on("error", (err) => console.error("[Redis] Connection error:", err));
  client.on("reconnecting", () => console.log("[Redis] Reconnecting..."));
  
  await client.connect();
  console.log("[Redis] Connected successfully");
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

export function isRedisAvailable(): boolean {
  return client !== null && client.isReady;
}
```

**Dependency:** `pnpm add redis` (the official Node.js Redis client, MIT license, no vendor lock-in).

### 3.3 Feature Flag: Graceful Degradation

The migration uses a feature flag pattern that falls back to in-memory stores if Redis is unavailable. This ensures zero downtime during the migration period.

```typescript
// server/cache.ts — UPDATED
import { getRedis, isRedisAvailable } from "./redis";

const localStore = new Map<string, { value: string; expiresAt: number }>();

export async function cacheThrough<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  // Try Redis first
  if (isRedisAvailable()) {
    try {
      const redis = await getRedis();
      const cached = await redis.get(`mk:cache:${key}`);
      if (cached) return JSON.parse(cached) as T;
      
      const value = await fn();
      await redis.setEx(`mk:cache:${key}`, Math.ceil(ttlMs / 1000), JSON.stringify(value));
      return value;
    } catch (err) {
      console.error("[Cache] Redis error, falling back to memory:", err);
    }
  }
  
  // Fallback to in-memory
  const cached = localStore.get(key);
  if (cached && Date.now() < cached.expiresAt) return JSON.parse(cached.value) as T;
  
  const value = await fn();
  localStore.set(key, { value: JSON.stringify(value), expiresAt: Date.now() + ttlMs });
  return value;
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  // Clear local
  for (const key of localStore.keys()) {
    if (key.startsWith(pattern)) localStore.delete(key);
  }
  
  // Clear Redis
  if (isRedisAvailable()) {
    try {
      const redis = await getRedis();
      const keys = await redis.keys(`mk:cache:${pattern}*`);
      if (keys.length > 0) await redis.del(keys);
    } catch (err) {
      console.error("[Cache] Redis invalidation error:", err);
    }
  }
}
```

---

## 4. Redis-Backed Rate Limiter

### 4.1 Design

The rate limiter uses Redis sorted sets for sliding window counting. Each request adds a timestamped entry; expired entries are pruned on each check. This provides accurate rate limiting across all instances.

**Updated file:** `server/rate-limiter.ts`

```typescript
import { getRedis, isRedisAvailable } from "./redis";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 10 },
  otp_send: { windowMs: 5 * 60 * 1000, maxRequests: 5 },
  otp_verify: { windowMs: 5 * 60 * 1000, maxRequests: 10 },
  general: { windowMs: 60 * 1000, maxRequests: 100 },
} as const;

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `mk:ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  if (isRedisAvailable()) {
    try {
      const redis = await getRedis();
      
      // Atomic: remove expired + count + add current — via pipeline
      const pipeline = redis.multi();
      pipeline.zRemRangeByScore(key, 0, windowStart);
      pipeline.zCard(key);
      pipeline.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
      pipeline.pExpire(key, config.windowMs);
      
      const results = await pipeline.exec();
      const count = results[1] as number;
      
      return {
        allowed: count < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count - 1),
        resetAt: now + config.windowMs,
      };
    } catch (err) {
      console.error("[RateLimit] Redis error, falling back to memory:", err);
    }
  }
  
  // Fallback to in-memory (existing implementation)
  return checkRateLimitInMemory(identifier, config);
}
```

### 4.2 Key Naming Convention

All Redis keys use the prefix `mk:` to avoid collisions with other services sharing the same Redis instance.

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `mk:cache:settings` | Site settings cache | 60s |
| `mk:cache:properties:search:*` | Search result cache | 120s |
| `mk:cache:permissions:*` | Admin permission cache | 60s |
| `mk:ratelimit:auth:*` | Auth rate limit counters | 5min |
| `mk:ratelimit:general:*` | General rate limit counters | 1min |
| `mk:session:family:*` | Refresh token families (future) | 7d |

---

## 5. Scalability Roadmap

### 5.1 Phase 1: Single Instance + Redis (Current → 30 Days)

The immediate goal is to add Redis as an external store while keeping a single Railway instance. This provides persistence across deploys and prepares for horizontal scaling.

```
┌──────────────┐     ┌──────────────┐
│   Railway     │     │   Railway     │
│   Express     │────→│   Redis      │
│   (1 instance)│     │   (256MB)    │
└──────┬───────┘     └──────────────┘
       │
┌──────▼───────┐
│   Railway     │
│   MySQL 8     │
└──────────────┘
```

### 5.2 Phase 2: Horizontal Scaling (30 → 90 Days)

After Redis migration is complete, the application can be scaled to multiple instances behind Railway's load balancer. The stateless design (no in-memory state) ensures consistent behavior across instances.

```
                    ┌──────────────────┐
                    │  Railway LB       │
                    └──────┬───────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──┐  ┌──────▼──┐  ┌──────▼──┐
       │ Express │  │ Express │  │ Express │
       │ Inst. 1 │  │ Inst. 2 │  │ Inst. 3 │
       └────┬────┘  └────┬────┘  └────┬────┘
            │            │            │
            └────────────┼────────────┘
                         │
              ┌──────────▼──────────┐
              │      Redis          │
              │  (shared state)     │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │      MySQL 8        │
              └─────────────────────┘
```

### 5.3 Phase 3: Advanced Caching (90+ Days)

For high-traffic scenarios, introduce cache warming and pub/sub-based invalidation:

| Feature | Implementation | Benefit |
|---------|---------------|---------|
| **Cache warming** | On startup, pre-populate settings and featured properties | Eliminates cold-start cache misses |
| **Pub/Sub invalidation** | Redis pub/sub channel `mk:invalidate` — all instances subscribe and clear local caches | Sub-second cache consistency |
| **Response caching** | Cache full tRPC responses for public queries (search, featured) | Reduces DB load by 80%+ for read-heavy pages |
| **CDN caching** | Add `Cache-Control` headers for static API responses | Offloads traffic from origin |

---

## 6. Stateless Application Checklist

Before horizontal scaling, the application must be fully stateless. The following table tracks state that currently lives in-process:

| State | Current Location | Target Location | Migration Status |
|-------|-----------------|-----------------|-----------------|
| Cache entries | `server/cache.ts` (Map) | Redis | Planned |
| Rate limit counters | `server/rate-limiter.ts` (Map) | Redis | Planned |
| Permission cache | `server/permissions.ts` (Map) | Redis | Planned |
| File uploads (temp) | Local filesystem | S3-compatible storage (already using `storagePut`) | Done |
| Session tokens | JWT in cookie (stateless) | No change needed | Done |
| Beds24 access token | `Beds24TokenManager` (in-memory) | Redis (with lock for concurrent refresh) | Planned (Hub-API only) |
| BullMQ job queue | Not yet implemented | Redis-backed BullMQ | Future |

---

## 7. Monitoring & Observability

### 7.1 Redis Metrics

After Redis is deployed, the following metrics should be monitored:

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| Memory usage | `INFO memory` → `used_memory` | > 200MB (80% of 256MB) |
| Connected clients | `INFO clients` → `connected_clients` | > 50 |
| Cache hit rate | Application-level counter | < 70% (investigate cache TTLs) |
| Evicted keys | `INFO stats` → `evicted_keys` | > 100/min (increase `maxmemory`) |
| Latency | `LATENCY LATEST` | p99 > 10ms |

### 7.2 Health Check Endpoint

The existing health check should be extended to include Redis status:

```typescript
// server/_core/systemRouter.ts — extend health check
app.get("/api/health", async (req, res) => {
  const redis = isRedisAvailable();
  const db = await checkDbConnection(); // ping query
  
  res.json({
    status: redis && db ? "healthy" : "degraded",
    services: {
      database: db ? "up" : "down",
      redis: redis ? "up" : "unavailable (using fallback)",
      cache: redis ? "redis" : "in-memory",
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

---

## 8. Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `server/redis.ts` | **New** | Redis client module with connection management and health checks |
| `server/cache.ts` | **Modify** | Add Redis-backed caching with in-memory fallback |
| `server/rate-limiter.ts` | **Modify** | Add Redis-backed rate limiting with sorted set sliding window |
| `server/permissions.ts` | **Modify** | Move permission cache to Redis |
| `server/_core/index.ts` | **Modify** | Initialize Redis on startup, add to health check |
| `package.json` | **Modify** | Add `redis` dependency (~1.2MB, MIT license) |

**New environment variable:** `REDIS_URL` (optional — system degrades gracefully without it).

**No Beds24 changes.** The Beds24 SDK token manager remains in-memory within the Hub-API service.  
**No Mansun dependency added.** Redis is a standard open-source infrastructure component with no vendor lock-in.

---

## References

[1]: https://redis.io/docs/latest/develop/reference/clients/ "Redis Client Libraries — Official Documentation"
[2]: https://redis.io/docs/latest/develop/interact/programmability/eval-intro/ "Redis Scripting — Atomic Operations"
