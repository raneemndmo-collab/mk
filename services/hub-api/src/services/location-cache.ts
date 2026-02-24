/**
 * ═══════════════════════════════════════════════════════════════
 *  Location Resolve Cache — Redis (fast) + Postgres (persistent)
 * ═══════════════════════════════════════════════════════════════
 *
 *  FULLY ADDITIVE — does NOT touch any existing code paths.
 *
 *  Cache strategy:
 *    1. Redis (fast path, 30-day TTL) — checked first
 *    2. Postgres (persistent fallback) — checked if Redis misses or unavailable
 *    3. On resolve success → write to BOTH Redis + Postgres
 *
 *  Graceful degradation:
 *    - Redis unavailable → Postgres-only mode (slower but works)
 *    - Postgres unavailable → no caching (resolve still works)
 *    - Both unavailable → no caching (resolve still works)
 *
 *  Cache key: sha256(normalized_final_url)
 *  Cache TTL: 30 days (configurable via LOCATION_CACHE_TTL_MS)
 * ═══════════════════════════════════════════════════════════════
 */

import Redis from "ioredis";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { db } from "../db/connection.js";
import { locationResolveCache } from "../db/schema.js";
import { LOCATION_CACHE_TTL_MS } from "@mk/shared";
import type { LocationResolveResult } from "@mk/shared";

// ─── Types ────────────────────────────────────────────────────

interface CachedLocation {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string | null;
  final_url: string;
  resolved_via: string;
}

// ─── Redis Connection (lazy, singleton) ───────────────────────

let redisClient: Redis | null = null;
let redisAvailable = true;

function getRedis(): Redis | null {
  if (!redisAvailable) return null;

  if (!redisClient) {
    try {
      redisClient = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            redisAvailable = false;
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        connectTimeout: 5000,
        lazyConnect: true,
      });

      redisClient.on("error", () => {
        // Silently degrade — Postgres fallback will handle it
        redisAvailable = false;
      });

      redisClient.on("connect", () => {
        redisAvailable = true;
      });
    } catch {
      redisAvailable = false;
      return null;
    }
  }

  return redisClient;
}

// ─── Cache Key Prefix ─────────────────────────────────────────

const REDIS_PREFIX = "mk:loc:";
const REDIS_TTL_SEC = Math.floor(LOCATION_CACHE_TTL_MS / 1000);

// ─── Redis Cache Operations ──────────────────────────────────

async function getFromRedis(urlHash: string): Promise<CachedLocation | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    await redis.connect().catch(() => {}); // Ensure connected
    const raw = await redis.get(`${REDIS_PREFIX}${urlHash}`);
    if (!raw) return null;
    return JSON.parse(raw) as CachedLocation;
  } catch {
    // Redis error — graceful degradation
    return null;
  }
}

async function setInRedis(urlHash: string, data: CachedLocation): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.connect().catch(() => {}); // Ensure connected
    await redis.setex(
      `${REDIS_PREFIX}${urlHash}`,
      REDIS_TTL_SEC,
      JSON.stringify(data),
    );
  } catch {
    // Redis write error — non-critical, Postgres is the source of truth
  }
}

// ─── Postgres Cache Operations ───────────────────────────────

async function getFromPostgres(urlHash: string): Promise<CachedLocation | null> {
  try {
    const rows = await db
      .select()
      .from(locationResolveCache)
      .where(eq(locationResolveCache.urlHash, urlHash))
      .limit(1);

    if (!rows.length) return null;

    const row = rows[0];

    // Check expiry
    if (new Date(row.expiresAt) < new Date()) {
      // Expired — don't return, let it be resolved fresh
      return null;
    }

    return {
      lat: parseFloat(String(row.lat)),
      lng: parseFloat(String(row.lng)),
      formatted_address: row.formattedAddress,
      place_id: row.placeId,
      final_url: row.finalUrl,
      resolved_via: row.resolvedVia,
    };
  } catch {
    // Postgres error — graceful degradation
    return null;
  }
}

async function setInPostgres(
  urlHash: string,
  originalUrl: string,
  data: CachedLocation,
): Promise<void> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCATION_CACHE_TTL_MS);

    // Upsert: insert or update on conflict
    await db
      .insert(locationResolveCache)
      .values({
        urlHash,
        originalUrl,
        finalUrl: data.final_url,
        lat: String(data.lat),
        lng: String(data.lng),
        formattedAddress: data.formatted_address,
        placeId: data.place_id,
        resolvedVia: data.resolved_via,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: locationResolveCache.urlHash,
        set: {
          finalUrl: data.final_url,
          lat: String(data.lat),
          lng: String(data.lng),
          formattedAddress: data.formatted_address,
          placeId: data.place_id,
          resolvedVia: data.resolved_via,
          updatedAt: now,
          expiresAt,
        },
      });
  } catch {
    // Postgres write error — non-critical, resolve still succeeded
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Look up a cached location by URL hash.
 * Checks Redis first, then Postgres.
 * Returns null on cache miss.
 */
export async function getCachedLocation(urlHash: string): Promise<CachedLocation | null> {
  // Fast path: Redis
  const redisResult = await getFromRedis(urlHash);
  if (redisResult) return redisResult;

  // Warm path: Postgres
  const pgResult = await getFromPostgres(urlHash);
  if (pgResult) {
    // Backfill Redis for next time
    await setInRedis(urlHash, pgResult);
    return pgResult;
  }

  return null;
}

/**
 * Store a resolved location in both Redis and Postgres.
 * Non-blocking — errors are swallowed (graceful degradation).
 */
export async function cacheLocation(
  urlHash: string,
  originalUrl: string,
  result: LocationResolveResult & { resolved_via: string },
): Promise<void> {
  const data: CachedLocation = {
    lat: result.lat,
    lng: result.lng,
    formatted_address: result.formatted_address,
    place_id: result.place_id,
    final_url: result.google_maps_url,
    resolved_via: result.resolved_via,
  };

  // Write to both in parallel — both are non-critical
  await Promise.allSettled([
    setInRedis(urlHash, data),
    setInPostgres(urlHash, originalUrl, data),
  ]);
}

/**
 * Convert a cached location to a full LocationResolveResult.
 */
export function cachedToResult(
  cached: CachedLocation,
  unitNumber: string | null,
  addressNotes: string | null,
): LocationResolveResult & { resolved_via: string; cached: boolean } {
  return {
    lat: cached.lat,
    lng: cached.lng,
    formatted_address: cached.formatted_address,
    place_id: cached.place_id,
    google_maps_url: cached.final_url,
    unit_number: unitNumber,
    address_notes: addressNotes,
    resolved_via: "cache",
    degraded: false,
    resolution_quality: cached.place_id ? "full" : "coords_only",
    cached: true,
  };
}

/**
 * Gracefully close Redis connection (for clean shutdown).
 */
export async function closeCache(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore
    }
    redisClient = null;
  }
}
