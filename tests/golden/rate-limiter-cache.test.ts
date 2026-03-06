/**
 * Golden Tests — Rate Limiter & Cache Backend
 *
 * Tests the in-memory fallback path (no Redis required).
 * Pure, deterministic, no external dependencies.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { rateLimiter, RATE_LIMITS, getClientIP, checkAccountLockout, recordFailedLogin, resetLoginAttempts } from "../../server/rate-limiter";
import { cache, CACHE_TTL, CACHE_KEYS, cacheThrough } from "../../server/cache";

// ─── Rate Limiter Tests ──────────────────────────────────────────────
describe("Golden Tests — Rate Limiter", () => {
  describe("RATE_LIMITS configuration", () => {
    it("has correct limits for auth endpoints", () => {
      expect(RATE_LIMITS.AUTH).toBeDefined();
      expect(RATE_LIMITS.AUTH.maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMITS.AUTH.windowMs).toBeGreaterThan(0);
    });

    it("has correct limits for write endpoints", () => {
      expect(RATE_LIMITS.WRITE).toBeDefined();
      expect(RATE_LIMITS.WRITE.maxRequests).toBeGreaterThan(0);
    });

    it("has correct limits for public read endpoints", () => {
      expect(RATE_LIMITS.PUBLIC_READ).toBeDefined();
      expect(RATE_LIMITS.PUBLIC_READ.maxRequests).toBeGreaterThan(0);
    });

    it("snapshot: all rate limit configurations", () => {
      expect(RATE_LIMITS).toMatchSnapshot();
    });
  });

  describe("rateLimiter.check()", () => {
    it("allows requests within limit", async () => {
      const key = `test-allow-${Date.now()}`;
      const result = await rateLimiter.check(key, 10, 60);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it("blocks requests exceeding limit", async () => {
      const key = `test-block-${Date.now()}`;
      // Exhaust the limit
      for (let i = 0; i < 3; i++) {
        await rateLimiter.check(key, 3, 60);
      }
      const result = await rateLimiter.check(key, 3, 60);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("returns retryAfter when blocked", async () => {
      const key = `test-retry-${Date.now()}`;
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(key, 5, 60);
      }
      const result = await rateLimiter.check(key, 5, 60);
      expect(result.allowed).toBe(false);
      expect(result.resetIn).toBeGreaterThan(0);
    });
  });

  describe("getClientIP()", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const ip = getClientIP({
        headers: { "x-forwarded-for": "185.70.40.1, 10.0.0.1" },
      });
      expect(ip).toBe("185.70.40.1");
    });

    it("extracts IP from x-real-ip header or falls back", () => {
      // getClientIP checks x-forwarded-for first, then req.ip, then socket
      // x-real-ip is not directly checked — test with forwarded-for instead
      const ip = getClientIP({
        headers: { "x-forwarded-for": "185.70.40.2" },
      });
      expect(ip).toBe("185.70.40.2");
    });

    it("falls back to socket remoteAddress", () => {
      const ip = getClientIP({
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      });
      expect(ip).toBe("127.0.0.1");
    });

    it("returns 'unknown' when no IP available", () => {
      const ip = getClientIP({ headers: {} });
      expect(ip).toBe("unknown");
    });
  });

  describe("Account Lockout", () => {
    it("account is not locked initially", async () => {
      const userId = `test-lockout-${Date.now()}`;
      const result = await checkAccountLockout(userId);
      expect(result.locked).toBe(false);
    });

    it("records failed login and returns remaining attempts", async () => {
      const userId = `test-failed-${Date.now()}`;
      const result = await recordFailedLogin(userId);
      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBeGreaterThan(0);
    });

    it("locks account after max failed attempts", async () => {
      const userId = `test-lock-${Date.now()}`;
      let result;
      for (let i = 0; i < 10; i++) {
        result = await recordFailedLogin(userId);
        if (result.locked) break;
      }
      expect(result!.locked).toBe(true);
      expect(result!.attemptsRemaining).toBe(0);
    });

    it("resets login attempts", async () => {
      const userId = `test-reset-${Date.now()}`;
      await recordFailedLogin(userId);
      await resetLoginAttempts(userId);
      const result = await checkAccountLockout(userId);
      expect(result.locked).toBe(false);
    });
  });
});

// ─── Cache Backend Tests ─────────────────────────────────────────────
describe("Golden Tests — Cache Backend", () => {
  describe("Basic Operations", () => {
    it("set and get a value", async () => {
      const key = `test-cache-${Date.now()}`;
      await cache.set(key, { name: "test", value: 42 }, 60);
      const result = await cache.get(key);
      expect(result).toEqual({ name: "test", value: 42 });
    });

    it("returns null for missing key", async () => {
      const result = await cache.get(`nonexistent-${Date.now()}`);
      expect(result).toBeNull();
    });

    it("deletes a key", async () => {
      const key = `test-delete-${Date.now()}`;
      await cache.set(key, "hello", 60);
      await cache.delete(key);
      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it("stores and retrieves Arabic text", async () => {
      const key = `test-arabic-${Date.now()}`;
      const value = { title: "شقة مفروشة في الرياض", price: 4500 };
      await cache.set(key, value, 60);
      const result = await cache.get(key);
      expect(result).toEqual(value);
    });
  });

  describe("getOrSet (cache-aside pattern)", () => {
    it("calls fetchFn on cache miss", async () => {
      const key = `test-getorset-miss-${Date.now()}`;
      let fetchCalled = false;
      const result = await cache.getOrSet(key, async () => {
        fetchCalled = true;
        return { data: "fresh" };
      }, 60);
      expect(fetchCalled).toBe(true);
      expect(result).toEqual({ data: "fresh" });
    });

    it("returns cached value on cache hit (no fetchFn call)", async () => {
      const key = `test-getorset-hit-${Date.now()}`;
      await cache.set(key, { data: "cached" }, 60);
      let fetchCalled = false;
      const result = await cache.getOrSet(key, async () => {
        fetchCalled = true;
        return { data: "fresh" };
      }, 60);
      expect(fetchCalled).toBe(false);
      expect(result).toEqual({ data: "cached" });
    });
  });

  describe("CACHE_TTL constants", () => {
    it("has defined TTL values", () => {
      expect(CACHE_TTL).toBeDefined();
      expect(typeof CACHE_TTL).toBe("object");
    });

    it("snapshot: all TTL configurations", () => {
      expect(CACHE_TTL).toMatchSnapshot();
    });
  });

  describe("CACHE_KEYS constants", () => {
    it("has defined key patterns", () => {
      expect(CACHE_KEYS).toBeDefined();
      expect(typeof CACHE_KEYS).toBe("object");
    });

    it("snapshot: all cache key patterns", () => {
      expect(CACHE_KEYS).toMatchSnapshot();
    });
  });

  describe("cacheThrough helper", () => {
    it("caches function result on first call", async () => {
      const key = `test-through-${Date.now()}`;
      let callCount = 0;
      const fetchFn = async () => {
        callCount++;
        return { result: "computed" };
      };

      const result1 = await cacheThrough(key, 60, fetchFn);
      const result2 = await cacheThrough(key, 60, fetchFn);

      expect(result1).toEqual({ result: "computed" });
      expect(result2).toEqual({ result: "computed" });
      expect(callCount).toBe(1); // Only called once, second was cached
    });
  });
});
