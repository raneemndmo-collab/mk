import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { featureFlags } from "../db/schema.js";
import type { FeatureFlagScope } from "@mk/shared";

/** In-memory cache with TTL */
const cache = new Map<string, { enabled: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function isFeatureEnabled(
  key: string,
  scope?: FeatureFlagScope
): Promise<boolean> {
  const cacheKey = `${key}:${scope ?? "GLOBAL"}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.enabled;
  }

  const flag = await db.query.featureFlags.findFirst({
    where: eq(featureFlags.key, key),
  });

  const enabled = flag?.enabled ?? false;
  cache.set(cacheKey, { enabled, expiresAt: Date.now() + CACHE_TTL_MS });
  return enabled;
}

export function invalidateFeatureFlagCache(): void {
  cache.clear();
}
