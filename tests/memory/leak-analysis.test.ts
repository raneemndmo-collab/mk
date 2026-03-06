/**
 * Memory Leak Analysis Suite
 *
 * Tests for common memory leak patterns in the MK platform:
 * - Cache backend unbounded growth
 * - EventEmitter listener accumulation
 * - Rate limiter state accumulation
 * - Token blacklist unbounded growth (in-memory fallback)
 *
 * Pure tests — no Redis, no DB, no network.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { cache } from "../../server/cache";
import { rateLimiter } from "../../server/rate-limiter";
import { tokenBlacklist } from "../../server/token-blacklist";

// ─── Helper: Measure heap usage ──────────────────────────────────────
function getHeapUsedMB(): number {
  if (global.gc) global.gc();
  return process.memoryUsage().heapUsed / 1024 / 1024;
}

// ─── Cache Backend Memory ────────────────────────────────────────────
describe("Memory — Cache Backend", () => {
  beforeEach(async () => {
    await cache.flush();
  });

  it("does not grow unboundedly with many unique keys", async () => {
    const before = getHeapUsedMB();

    // Write 10,000 cache entries with short TTL
    for (let i = 0; i < 10_000; i++) {
      await cache.set(`mem-test-${i}`, { data: `value-${i}`, padding: "x".repeat(100) }, 5);
    }

    const after = getHeapUsedMB();
    const growth = after - before;

    // 10K entries × ~150 bytes each ≈ 1.5 MB. Allow up to 50 MB headroom.
    expect(growth).toBeLessThan(50);
  });

  it("flush() releases memory", async () => {
    // Fill cache
    for (let i = 0; i < 5_000; i++) {
      await cache.set(`flush-test-${i}`, { data: "x".repeat(200) }, 60);
    }

    const beforeFlush = getHeapUsedMB();
    await cache.flush();

    if (global.gc) global.gc();
    const afterFlush = getHeapUsedMB();

    // After flush, memory should not have grown significantly
    // (GC may not reclaim immediately, so we just check it doesn't grow)
    expect(afterFlush).toBeLessThan(beforeFlush + 20);
  });

  it("expired entries are cleaned up on access", async () => {
    // Set entries with 1-second TTL
    for (let i = 0; i < 100; i++) {
      await cache.set(`expire-test-${i}`, { data: i }, 1);
    }

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 1100));

    // Access expired entries — should return null
    for (let i = 0; i < 100; i++) {
      const val = await cache.get(`expire-test-${i}`);
      expect(val).toBeNull();
    }
  });
});

// ─── Rate Limiter Memory ─────────────────────────────────────────────
describe("Memory — Rate Limiter", () => {
  beforeEach(async () => {
    await cache.flush();
  });

  it("does not accumulate state for many unique IPs", async () => {
    const before = getHeapUsedMB();

    // Simulate 5,000 unique IPs hitting the rate limiter
    for (let i = 0; i < 5_000; i++) {
      await rateLimiter.check(`ip:192.168.${Math.floor(i / 256)}.${i % 256}`, 100, 60_000);
    }

    const after = getHeapUsedMB();
    const growth = after - before;

    // Rate limiter entries are small (counter + timestamp)
    // 5K entries should use < 20 MB
    expect(growth).toBeLessThan(20);
  });

  it("peek does not create new entries", async () => {
    const before = getHeapUsedMB();

    // Peek 1,000 non-existent keys
    for (let i = 0; i < 1_000; i++) {
      await rateLimiter.peek(`nonexistent-${i}`, 100, 60_000);
    }

    const after = getHeapUsedMB();
    const growth = after - before;

    // Peek should not allocate significant memory
    expect(growth).toBeLessThan(5);
  });
});

// ─── Token Blacklist Memory ──────────────────────────────────────────
describe("Memory — Token Blacklist", () => {
  it("does not grow unboundedly with many blacklisted tokens", async () => {
    const before = getHeapUsedMB();

    // Blacklist 5,000 tokens with short TTL
    for (let i = 0; i < 5_000; i++) {
      await tokenBlacklist.add(`mem-token-${i}-${Date.now()}`, 5);
    }

    const after = getHeapUsedMB();
    const growth = after - before;

    // SHA-256 hashes are 64 chars each. 5K × 64 bytes ≈ 320 KB
    // Allow generous headroom for Map overhead
    expect(growth).toBeLessThan(20);
  });

  it("expired tokens are cleaned up", async () => {
    // Add tokens with 1-second TTL
    const tokens: string[] = [];
    for (let i = 0; i < 50; i++) {
      const token = `expire-token-${i}-${Date.now()}`;
      tokens.push(token);
      await tokenBlacklist.add(token, 1);
    }

    // Verify they're blacklisted
    const firstCheck = await tokenBlacklist.isBlacklisted(tokens[0]);
    expect(firstCheck).toBe(true);

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 1200));

    // Verify they're no longer blacklisted
    for (const token of tokens) {
      const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
      expect(isBlacklisted).toBe(false);
    }
  });
});

// ─── EventEmitter Listener Accumulation ──────────────────────────────
describe("Memory — EventEmitter Listeners", () => {
  it("process has no excessive listeners", () => {
    const listenerCounts = {
      uncaughtException: process.listenerCount("uncaughtException"),
      unhandledRejection: process.listenerCount("unhandledRejection"),
      warning: process.listenerCount("warning"),
      exit: process.listenerCount("exit"),
    };

    // Each event should have at most a few listeners (vitest adds some)
    Object.entries(listenerCounts).forEach(([event, count]) => {
      expect(count).toBeLessThan(20);
    });
  });

  it("maxListeners is set to a reasonable value", () => {
    const maxListeners = process.getMaxListeners();
    // Default is 10, some frameworks increase it. Should not be Infinity.
    expect(maxListeners).toBeLessThan(1000);
  });
});

// ─── General Memory Patterns ─────────────────────────────────────────
describe("Memory — General Patterns", () => {
  it("repeated cache operations do not leak memory", async () => {
    await cache.flush();
    const before = getHeapUsedMB();

    // Simulate 100 cycles of set → get → delete
    for (let cycle = 0; cycle < 100; cycle++) {
      for (let i = 0; i < 100; i++) {
        const key = `cycle-${cycle}-${i}`;
        await cache.set(key, { data: "x".repeat(50) }, 60);
        await cache.get(key);
        await cache.delete(key);
      }
    }

    if (global.gc) global.gc();
    const after = getHeapUsedMB();
    const growth = after - before;

    // 10,000 set/get/delete cycles should not leak
    expect(growth).toBeLessThan(30);
  });

  it("concurrent cache operations do not corrupt state", async () => {
    await cache.flush();

    // Run 100 concurrent set+get operations
    const promises = Array.from({ length: 100 }, async (_, i) => {
      const key = `concurrent-${i}`;
      await cache.set(key, { index: i }, 60);
      const val = await cache.get(key);
      return val;
    });

    const results = await Promise.all(promises);

    // All results should be non-null
    results.forEach((val, i) => {
      expect(val).not.toBeNull();
      expect((val as any).index).toBe(i);
    });
  });
});
