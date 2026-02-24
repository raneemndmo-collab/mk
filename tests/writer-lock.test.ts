/**
 * ═══════════════════════════════════════════════════════════════
 *  Writer Lock — Automated Tests
 * ═══════════════════════════════════════════════════════════════
 *
 *  These tests prove the writer-lock invariant:
 *
 *    STANDALONE mode:
 *      ✅ Adapter POST /bookings → works (201)
 *      ❌ Hub-API POST /bookings → 409 WRITER_LOCK_VIOLATION
 *
 *    INTEGRATED mode:
 *      ❌ Adapter POST /bookings → 409 WRITER_LOCK_VIOLATION
 *      ✅ Hub-API POST /bookings → works (201)
 *
 *  Tests are pure unit tests — no Beds24 or DB required.
 *  They test the decision logic, not the full HTTP stack.
 *
 *  Run: npx vitest run tests/writer-lock.test.ts
 * ═══════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from "vitest";
import {
  isWriterAllowed,
  getDesignatedWriter,
  WRITER_LOCK,
  ERROR_CODES,
  HTTP_STATUS,
  BRAND_RULES,
} from "@mk/shared";
import type { Brand, OperationMode, WriterLockError } from "@mk/shared";

// ═══════════════════════════════════════════════════════════
//  1. Shared Foundation Tests — isWriterAllowed / getDesignatedWriter
// ═══════════════════════════════════════════════════════════

describe("WRITER_LOCK constant", () => {
  it("standalone mode designates adapter as writer", () => {
    expect(WRITER_LOCK.standalone.writer).toBe("adapter");
    expect(WRITER_LOCK.standalone.rejector).toBe("hub-api");
  });

  it("integrated mode designates hub-api as writer", () => {
    expect(WRITER_LOCK.integrated.writer).toBe("hub-api");
    expect(WRITER_LOCK.integrated.rejector).toBe("adapter");
  });
});

describe("getDesignatedWriter()", () => {
  it("returns 'adapter' for standalone mode", () => {
    expect(getDesignatedWriter("standalone")).toBe("adapter");
  });

  it("returns 'hub-api' for integrated mode", () => {
    expect(getDesignatedWriter("integrated")).toBe("hub-api");
  });
});

describe("isWriterAllowed()", () => {
  // ── Standalone mode ──────────────────────────────────────
  it("standalone: adapter IS allowed to write", () => {
    expect(isWriterAllowed("standalone", "adapter")).toBe(true);
  });

  it("standalone: hub-api is NOT allowed to write", () => {
    expect(isWriterAllowed("standalone", "hub-api")).toBe(false);
  });

  // ── Integrated mode ──────────────────────────────────────
  it("integrated: hub-api IS allowed to write", () => {
    expect(isWriterAllowed("integrated", "hub-api")).toBe(true);
  });

  it("integrated: adapter is NOT allowed to write", () => {
    expect(isWriterAllowed("integrated", "adapter")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
//  2. Adapter-Side Writer Lock Simulation
//     Simulates the exact guard logic from adapter code
// ═══════════════════════════════════════════════════════════

/**
 * Simulates the adapter's POST /bookings route guard.
 * This is the exact logic from:
 *   services/cobnb-adapter-api/src/index.ts:268-272
 *   services/monthlykey-adapter-api/src/index.ts:266-270
 */
function simulateAdapterBookingCreate(
  brand: Brand,
  mode: OperationMode
): { status: number; body: WriterLockError | { id: string; writer: string } } {
  const ADAPTER_IS_WRITER = isWriterAllowed(mode, "adapter");
  const DESIGNATED_WRITER = getDesignatedWriter(mode);

  // This is the exact guard from the adapter code
  if (!ADAPTER_IS_WRITER) {
    return {
      status: HTTP_STATUS.CONFLICT, // 409
      body: {
        code: ERROR_CODES.WRITER_LOCK_VIOLATION,
        message: `Booking writes for ${brand} are locked to ${DESIGNATED_WRITER}.`,
        brand,
        mode,
        designatedWriter: DESIGNATED_WRITER,
        rejectedBy: "adapter",
      },
    };
  }

  // Adapter would write to Beds24 here
  return {
    status: HTTP_STATUS.CREATED, // 201
    body: { id: "booking-123", writer: "adapter" },
  };
}

describe("Adapter-side writer lock (CoBnB)", () => {
  it("STANDALONE: adapter POST /bookings → 201 (adapter writes to Beds24)", () => {
    const result = simulateAdapterBookingCreate("COBNB", "standalone");
    expect(result.status).toBe(201);
    expect((result.body as any).writer).toBe("adapter");
  });

  it("INTEGRATED: adapter POST /bookings → 409 WRITER_LOCK_VIOLATION", () => {
    const result = simulateAdapterBookingCreate("COBNB", "integrated");
    expect(result.status).toBe(409);
    const body = result.body as WriterLockError;
    expect(body.code).toBe("WRITER_LOCK_VIOLATION");
    expect(body.brand).toBe("COBNB");
    expect(body.mode).toBe("integrated");
    expect(body.designatedWriter).toBe("hub-api");
    expect(body.rejectedBy).toBe("adapter");
  });
});

describe("Adapter-side writer lock (MonthlyKey)", () => {
  it("STANDALONE: adapter POST /bookings → 201 (adapter writes to Beds24)", () => {
    const result = simulateAdapterBookingCreate("MONTHLYKEY", "standalone");
    expect(result.status).toBe(201);
    expect((result.body as any).writer).toBe("adapter");
  });

  it("INTEGRATED: adapter POST /bookings → 409 WRITER_LOCK_VIOLATION", () => {
    const result = simulateAdapterBookingCreate("MONTHLYKEY", "integrated");
    expect(result.status).toBe(409);
    const body = result.body as WriterLockError;
    expect(body.code).toBe("WRITER_LOCK_VIOLATION");
    expect(body.brand).toBe("MONTHLYKEY");
    expect(body.mode).toBe("integrated");
    expect(body.designatedWriter).toBe("hub-api");
    expect(body.rejectedBy).toBe("adapter");
  });
});

// ═══════════════════════════════════════════════════════════
//  3. Hub-API Side Writer Lock Simulation
//     Simulates the exact guard logic from hub-api
// ═══════════════════════════════════════════════════════════

/**
 * Simulates hub-api's BookingService.create() writer-lock check.
 * This is the exact logic from:
 *   services/hub-api/src/config.ts:82-90 (hubIsWriter, hubShouldRejectWrites)
 *   services/hub-api/src/services/booking-service.ts:91-110
 */
function simulateHubBookingCreate(
  brand: Brand,
  brandMode: OperationMode
): { status: number; body: WriterLockError | { id: string; writer: string } } {
  // This mirrors hubShouldRejectWrites() from config.ts:88-90
  const hubIsWriter = isWriterAllowed(brandMode, "hub-api");
  const hubShouldReject = !hubIsWriter;

  if (hubShouldReject) {
    const writer = getDesignatedWriter(brandMode);
    return {
      status: HTTP_STATUS.CONFLICT, // 409
      body: {
        code: ERROR_CODES.WRITER_LOCK_VIOLATION,
        message:
          `Hub-API cannot write bookings for ${brand} because it is in ${brandMode} mode. ` +
          `The designated writer is: ${writer} (the adapter).`,
        brand,
        mode: brandMode,
        designatedWriter: writer,
        rejectedBy: "hub-api",
      },
    };
  }

  // Hub would write to local DB + Beds24 here
  return {
    status: HTTP_STATUS.CREATED, // 201
    body: { id: "booking-456", writer: "hub-api" },
  };
}

describe("Hub-API side writer lock (CoBnB)", () => {
  it("STANDALONE: hub POST /bookings → 409 WRITER_LOCK_VIOLATION", () => {
    const result = simulateHubBookingCreate("COBNB", "standalone");
    expect(result.status).toBe(409);
    const body = result.body as WriterLockError;
    expect(body.code).toBe("WRITER_LOCK_VIOLATION");
    expect(body.brand).toBe("COBNB");
    expect(body.mode).toBe("standalone");
    expect(body.designatedWriter).toBe("adapter");
    expect(body.rejectedBy).toBe("hub-api");
  });

  it("INTEGRATED: hub POST /bookings → 201 (hub writes to DB + Beds24)", () => {
    const result = simulateHubBookingCreate("COBNB", "integrated");
    expect(result.status).toBe(201);
    expect((result.body as any).writer).toBe("hub-api");
  });
});

describe("Hub-API side writer lock (MonthlyKey)", () => {
  it("STANDALONE: hub POST /bookings → 409 WRITER_LOCK_VIOLATION", () => {
    const result = simulateHubBookingCreate("MONTHLYKEY", "standalone");
    expect(result.status).toBe(409);
    const body = result.body as WriterLockError;
    expect(body.code).toBe("WRITER_LOCK_VIOLATION");
    expect(body.brand).toBe("MONTHLYKEY");
    expect(body.mode).toBe("standalone");
    expect(body.designatedWriter).toBe("adapter");
    expect(body.rejectedBy).toBe("hub-api");
  });

  it("INTEGRATED: hub POST /bookings → 201 (hub writes to DB + Beds24)", () => {
    const result = simulateHubBookingCreate("MONTHLYKEY", "integrated");
    expect(result.status).toBe(201);
    expect((result.body as any).writer).toBe("hub-api");
  });
});

// ═══════════════════════════════════════════════════════════
//  4. Cross-Validation: Exactly ONE writer per brand
// ═══════════════════════════════════════════════════════════

describe("Writer lock invariant: exactly ONE writer per brand", () => {
  const brands: Brand[] = ["COBNB", "MONTHLYKEY"];
  const modes: OperationMode[] = ["standalone", "integrated"];

  for (const brand of brands) {
    for (const mode of modes) {
      it(`${brand} in ${mode} mode: exactly one writer, never zero, never two`, () => {
        const adapterCanWrite = isWriterAllowed(mode, "adapter");
        const hubCanWrite = isWriterAllowed(mode, "hub-api");

        // XOR: exactly one must be true
        expect(adapterCanWrite !== hubCanWrite).toBe(true);

        // Verify the designated writer matches
        const designated = getDesignatedWriter(mode);
        if (adapterCanWrite) {
          expect(designated).toBe("adapter");
        } else {
          expect(designated).toBe("hub-api");
        }
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════
//  5. Full Matrix: Both sides reject/accept correctly
// ═══════════════════════════════════════════════════════════

describe("Full writer-lock matrix", () => {
  it("COBNB standalone: adapter=201, hub=409", () => {
    const adapter = simulateAdapterBookingCreate("COBNB", "standalone");
    const hub = simulateHubBookingCreate("COBNB", "standalone");
    expect(adapter.status).toBe(201);
    expect(hub.status).toBe(409);
  });

  it("COBNB integrated: adapter=409, hub=201", () => {
    const adapter = simulateAdapterBookingCreate("COBNB", "integrated");
    const hub = simulateHubBookingCreate("COBNB", "integrated");
    expect(adapter.status).toBe(409);
    expect(hub.status).toBe(201);
  });

  it("MONTHLYKEY standalone: adapter=201, hub=409", () => {
    const adapter = simulateAdapterBookingCreate("MONTHLYKEY", "standalone");
    const hub = simulateHubBookingCreate("MONTHLYKEY", "standalone");
    expect(adapter.status).toBe(201);
    expect(hub.status).toBe(409);
  });

  it("MONTHLYKEY integrated: adapter=409, hub=201", () => {
    const adapter = simulateAdapterBookingCreate("MONTHLYKEY", "integrated");
    const hub = simulateHubBookingCreate("MONTHLYKEY", "integrated");
    expect(adapter.status).toBe(409);
    expect(hub.status).toBe(201);
  });
});

// ═══════════════════════════════════════════════════════════
//  6. Error Response Shape Validation
// ═══════════════════════════════════════════════════════════

describe("WriterLockError response shape", () => {
  it("409 response includes all required fields", () => {
    const result = simulateAdapterBookingCreate("COBNB", "integrated");
    expect(result.status).toBe(409);

    const body = result.body as WriterLockError;
    expect(body).toHaveProperty("code", "WRITER_LOCK_VIOLATION");
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("brand");
    expect(body).toHaveProperty("mode");
    expect(body).toHaveProperty("designatedWriter");
    expect(body).toHaveProperty("rejectedBy");
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
  });

  it("adapter rejection says rejectedBy=adapter", () => {
    const result = simulateAdapterBookingCreate("COBNB", "integrated");
    expect((result.body as WriterLockError).rejectedBy).toBe("adapter");
  });

  it("hub rejection says rejectedBy=hub-api", () => {
    const result = simulateHubBookingCreate("COBNB", "standalone");
    expect((result.body as WriterLockError).rejectedBy).toBe("hub-api");
  });
});

// ═══════════════════════════════════════════════════════════
//  7. Brand Rules Validation
// ═══════════════════════════════════════════════════════════

describe("Brand rules", () => {
  it("COBNB allows 1-27 nights", () => {
    expect(BRAND_RULES.COBNB.minNights).toBe(1);
    expect(BRAND_RULES.COBNB.maxNights).toBe(27);
  });

  it("MONTHLYKEY allows 28-365 nights", () => {
    expect(BRAND_RULES.MONTHLYKEY.minNights).toBe(28);
    expect(BRAND_RULES.MONTHLYKEY.maxNights).toBe(365);
  });

  it("brands have no gap and no overlap in night ranges", () => {
    expect(BRAND_RULES.COBNB.maxNights + 1).toBe(BRAND_RULES.MONTHLYKEY.minNights);
  });
});

// ═══════════════════════════════════════════════════════════
//  8. HTTP Status Code Constants
// ═══════════════════════════════════════════════════════════

describe("HTTP_STATUS constants used in writer lock", () => {
  it("CONFLICT is 409", () => {
    expect(HTTP_STATUS.CONFLICT).toBe(409);
  });

  it("CREATED is 201", () => {
    expect(HTTP_STATUS.CREATED).toBe(201);
  });

  it("BAD_REQUEST is 400", () => {
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════
//  9. Webhook Secret Rotation — Unit Tests
// ═══════════════════════════════════════════════════════════
//
//  These tests replicate the exact logic from
//  services/hub-api/src/routes/webhooks.ts without importing
//  Express or DB dependencies. They test:
//
//    ✅ During rotation window: both current + previous accepted
//    ✅ After window expires: previous rejected (401), current accepted
//    ✅ Strict mode: PREVIOUS set but ROTATION_START missing → rejected
//    ✅ Strict mode: ROTATION_START unparseable → rejected
//
// ═══════════════════════════════════════════════════════════

// ── Replicate the exact logic from webhooks.ts ────────────

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

interface RotationConfig {
  currentSecret: string;
  previousSecret: string;
  rotationStart: string;       // ISO 8601 or empty
  rotationWindowDays: number;
  secretHeader: string;
}

function isPreviousSecretInWindow(cfg: RotationConfig, now: number): boolean {
  if (!cfg.previousSecret) return false;

  // STRICT: ROTATION_START is REQUIRED
  if (!cfg.rotationStart) return false;

  const startDate = new Date(cfg.rotationStart);
  if (isNaN(startDate.getTime())) return false;

  const windowEndMs = startDate.getTime() + cfg.rotationWindowDays * 24 * 60 * 60 * 1000;
  return now <= windowEndMs;
}

type SecretCheckResult = {
  ok: boolean;
  reason: string;
  matchedSecret: "current" | "previous" | "none" | "not-configured";
};

function verifySharedSecret(
  providedSecret: string | undefined,
  cfg: RotationConfig,
  now: number
): SecretCheckResult {
  if (!cfg.currentSecret && !cfg.previousSecret) {
    return { ok: true, reason: "shared-secret-not-configured", matchedSecret: "not-configured" };
  }

  if (!providedSecret) {
    return { ok: false, reason: "shared-secret-header-missing", matchedSecret: "none" };
  }

  // Try current secret first
  if (cfg.currentSecret && constantTimeEqual(providedSecret, cfg.currentSecret)) {
    return { ok: true, reason: "shared-secret-verified", matchedSecret: "current" };
  }

  // Try previous secret if rotation window is open
  if (cfg.previousSecret && isPreviousSecretInWindow(cfg, now)) {
    if (constantTimeEqual(providedSecret, cfg.previousSecret)) {
      return { ok: true, reason: "shared-secret-matched-previous", matchedSecret: "previous" };
    }
  }

  return { ok: false, reason: "shared-secret-mismatch", matchedSecret: "none" };
}

// ── Simulate HTTP response based on secret check ──────────

function simulateWebhookAuth(
  providedSecret: string | undefined,
  cfg: RotationConfig,
  now: number
): { status: number; matchedSecret: string } {
  const result = verifySharedSecret(providedSecret, cfg, now);
  if (!result.ok) {
    return { status: 401, matchedSecret: result.matchedSecret };
  }
  return { status: 200, matchedSecret: result.matchedSecret };
}

// ── Test Data ─────────────────────────────────────────────

const CURRENT_SECRET = "mk-wh-2026-NEW-b8c4d2e6f1a3";
const PREVIOUS_SECRET = "mk-wh-2026-OLD-a7b3c9d1e5f2";
const WRONG_SECRET = "mk-wh-WRONG-xxxxxxxxxx";

// Rotation started 2026-03-01, window = 7 days → expires 2026-03-08
const ROTATION_START_DATE = "2026-03-01T00:00:00Z";
const ROTATION_WINDOW = 7;

const DURING_WINDOW = new Date("2026-03-04T12:00:00Z").getTime();  // Day 3 of 7
const AFTER_WINDOW  = new Date("2026-03-10T00:00:00Z").getTime();  // Day 9 (expired)

function makeConfig(overrides?: Partial<RotationConfig>): RotationConfig {
  return {
    currentSecret: CURRENT_SECRET,
    previousSecret: PREVIOUS_SECRET,
    rotationStart: ROTATION_START_DATE,
    rotationWindowDays: ROTATION_WINDOW,
    secretHeader: "x-webhook-secret",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════

describe("Webhook secret rotation — during window", () => {
  const cfg = makeConfig();

  it("current secret is accepted (200, matchedSecret=current)", () => {
    const result = simulateWebhookAuth(CURRENT_SECRET, cfg, DURING_WINDOW);
    expect(result.status).toBe(200);
    expect(result.matchedSecret).toBe("current");
  });

  it("previous secret is accepted (200, matchedSecret=previous)", () => {
    const result = simulateWebhookAuth(PREVIOUS_SECRET, cfg, DURING_WINDOW);
    expect(result.status).toBe(200);
    expect(result.matchedSecret).toBe("previous");
  });

  it("wrong secret is rejected (401)", () => {
    const result = simulateWebhookAuth(WRONG_SECRET, cfg, DURING_WINDOW);
    expect(result.status).toBe(401);
    expect(result.matchedSecret).toBe("none");
  });

  it("missing secret header is rejected (401)", () => {
    const result = simulateWebhookAuth(undefined, cfg, DURING_WINDOW);
    expect(result.status).toBe(401);
    expect(result.matchedSecret).toBe("none");
  });
});

describe("Webhook secret rotation — after window expires", () => {
  const cfg = makeConfig();

  it("current secret is still accepted (200)", () => {
    const result = simulateWebhookAuth(CURRENT_SECRET, cfg, AFTER_WINDOW);
    expect(result.status).toBe(200);
    expect(result.matchedSecret).toBe("current");
  });

  it("previous secret is REJECTED (401) — window expired", () => {
    const result = simulateWebhookAuth(PREVIOUS_SECRET, cfg, AFTER_WINDOW);
    expect(result.status).toBe(401);
    expect(result.matchedSecret).toBe("none");
  });

  it("wrong secret is still rejected (401)", () => {
    const result = simulateWebhookAuth(WRONG_SECRET, cfg, AFTER_WINDOW);
    expect(result.status).toBe(401);
  });
});

describe("Webhook secret rotation — strict mode", () => {
  it("PREVIOUS set but ROTATION_START missing → previous REJECTED (401)", () => {
    const cfg = makeConfig({ rotationStart: "" });
    const result = simulateWebhookAuth(PREVIOUS_SECRET, cfg, DURING_WINDOW);
    expect(result.status).toBe(401);
    expect(result.matchedSecret).toBe("none");
  });

  it("PREVIOUS set but ROTATION_START unparseable → previous REJECTED (401)", () => {
    const cfg = makeConfig({ rotationStart: "not-a-date" });
    const result = simulateWebhookAuth(PREVIOUS_SECRET, cfg, DURING_WINDOW);
    expect(result.status).toBe(401);
    expect(result.matchedSecret).toBe("none");
  });

  it("current secret still works even when ROTATION_START is missing", () => {
    const cfg = makeConfig({ rotationStart: "" });
    const result = simulateWebhookAuth(CURRENT_SECRET, cfg, DURING_WINDOW);
    expect(result.status).toBe(200);
    expect(result.matchedSecret).toBe("current");
  });

  it("current secret still works even when ROTATION_START is unparseable", () => {
    const cfg = makeConfig({ rotationStart: "garbage" });
    const result = simulateWebhookAuth(CURRENT_SECRET, cfg, DURING_WINDOW);
    expect(result.status).toBe(200);
    expect(result.matchedSecret).toBe("current");
  });
});

describe("Webhook secret rotation — edge cases", () => {
  it("no secrets configured at all → skip check (200, not-configured)", () => {
    const cfg = makeConfig({ currentSecret: "", previousSecret: "" });
    const result = simulateWebhookAuth(undefined, cfg, DURING_WINDOW);
    expect(result.status).toBe(200);
    expect(result.matchedSecret).toBe("not-configured");
  });

  it("only current secret, no previous → current accepted, wrong rejected", () => {
    const cfg = makeConfig({ previousSecret: "" });
    expect(simulateWebhookAuth(CURRENT_SECRET, cfg, DURING_WINDOW).status).toBe(200);
    expect(simulateWebhookAuth(WRONG_SECRET, cfg, DURING_WINDOW).status).toBe(401);
  });

  it("exact boundary: request at windowEnd moment → still accepted", () => {
    // Window end = 2026-03-08T00:00:00Z (exactly 7 days after start)
    const exactEnd = new Date("2026-03-08T00:00:00Z").getTime();
    const cfg = makeConfig();
    const result = simulateWebhookAuth(PREVIOUS_SECRET, cfg, exactEnd);
    expect(result.status).toBe(200);
    expect(result.matchedSecret).toBe("previous");
  });

  it("1ms after window end → previous rejected", () => {
    const justAfter = new Date("2026-03-08T00:00:00Z").getTime() + 1;
    const cfg = makeConfig();
    const result = simulateWebhookAuth(PREVIOUS_SECRET, cfg, justAfter);
    expect(result.status).toBe(401);
    expect(result.matchedSecret).toBe("none");
  });
});
