/**
 * ═══════════════════════════════════════════════════════════════
 *  Webhook Routes — Hub-API
 * ═══════════════════════════════════════════════════════════════
 *
 *  ENABLE_BEDS24_WEBHOOKS=false (default, safest):
 *    → Returns 204 No Content immediately (no-op)
 *    → No processing, no queuing, no DB writes
 *
 *  ENABLE_BEDS24_WEBHOOKS=true:
 *    → Layer 1: IP allowlist (PRIMARY — Beds24 does not sign webhooks)
 *    → Layer 2: Static shared secret header (OPTIONAL — set in Beds24
 *               dashboard under "Custom Header" field, verified here)
 *    → Dedup via webhook_events table (UNIQUE on event_id)
 *    → If duplicate: returns 200 with dedup notice (skip)
 *    → If new: inserts PENDING event, enqueues to BullMQ, returns 200
 *    → Processing happens asynchronously in the worker service
 *
 *  IMPORTANT — Beds24 Webhook Security:
 *    Beds24 does NOT send HMAC signatures on webhooks. Their V2 booking
 *    webhooks are plain POST requests with JSON body. The only built-in
 *    security options are:
 *      1. IP allowlist (recommended — restrict to Beds24 server IPs)
 *      2. Static shared secret via "Custom Header" in Beds24 dashboard
 *         (set a header like X-Webhook-Secret: your-secret, we verify it)
 *      3. URL token (include a secret in the webhook URL path/query)
 *
 *    We implement options 1 and 2. Option 3 is not used because it leaks
 *    secrets in access logs.
 * ═══════════════════════════════════════════════════════════════
 */

import { Router } from "express";
import { db } from "../db/connection.js";
import { webhookEvents } from "../db/schema.js";
import { isFeatureEnabled, config } from "../config.js";
import { logger } from "../lib/logger.js";
import { webhookEventSchema, ERROR_CODES, HTTP_STATUS, WEBHOOK_MAX_RETRIES } from "@mk/shared";

const router = Router();

// ─── Configuration ────────────────────────────────────────
// IP allowlist: loaded from env at startup. Comma-separated.
// Empty = IP check disabled (not recommended for production).
const WEBHOOK_IP_ALLOWLIST: string[] = (process.env.BEDS24_WEBHOOK_IP_ALLOWLIST ?? "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

// Static shared secret: set in Beds24 dashboard as a Custom Header.
// Header name is configurable via BEDS24_WEBHOOK_SECRET_HEADER (default: x-webhook-secret).
const WEBHOOK_SECRET = config.beds24.webhookSecret;
const WEBHOOK_SECRET_HEADER = (process.env.BEDS24_WEBHOOK_SECRET_HEADER ?? "x-webhook-secret").toLowerCase();

// ─── BullMQ Queue (lazy-initialized) ───────────────────────
let webhookQueue: any = null;

async function getQueue() {
  if (webhookQueue) return webhookQueue;
  try {
    const { Queue } = await import("bullmq");
    webhookQueue = new Queue("webhook-events", {
      connection: { url: config.redisUrl },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
    return webhookQueue;
  } catch (err) {
    logger.warn({ err }, "BullMQ not available — webhook events stored but not queued");
    return null;
  }
}

// ─── Layer 1: IP Allowlist Verification (PRIMARY) ─────────
// Beds24 does NOT sign webhooks, so IP allowlist is the strongest
// authentication method available. Populate BEDS24_WEBHOOK_IP_ALLOWLIST
// with Beds24's server IPs from their documentation or support.
function verifySourceIP(req: import("express").Request): boolean {
  if (WEBHOOK_IP_ALLOWLIST.length === 0) return true; // Empty = disabled
  const forwarded = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim();
  const ip = forwarded ?? req.socket.remoteAddress ?? "";
  return WEBHOOK_IP_ALLOWLIST.some((allowed) => {
    // Exact match
    if (ip === allowed) return true;
    // CIDR prefix match (simplified: /16 → first two octets)
    if (allowed.includes("/")) {
      const prefix = allowed.split("/")[0];
      const prefixParts = prefix.split(".");
      const ipParts = ip.split(".");
      const cidr = parseInt(allowed.split("/")[1], 10);
      const octets = Math.floor(cidr / 8);
      return prefixParts.slice(0, octets).join(".") === ipParts.slice(0, octets).join(".");
    }
    return false;
  });
}

// ─── Layer 2: Static Shared Secret Header (OPTIONAL) ──────
// Beds24's Inventory Webhooks support "Custom Header" fields.
// Set a custom header in Beds24 dashboard like:
//   Header name:  X-Webhook-Secret
//   Header value: your-random-secret-here
// Then set BEDS24_WEBHOOK_SECRET=your-random-secret-here in .env
//
// This is NOT HMAC — it's a simple static string comparison.
// Beds24 does not compute signatures; it just forwards the header as-is.
function verifySharedSecret(req: import("express").Request): boolean {
  if (!WEBHOOK_SECRET) return true; // No secret configured = skip
  const provided = req.headers[WEBHOOK_SECRET_HEADER] as string | undefined;
  if (!provided) return false;
  // Constant-length comparison to prevent timing attacks
  if (provided.length !== WEBHOOK_SECRET.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ WEBHOOK_SECRET.charCodeAt(i);
  }
  return mismatch === 0;
}

// ═══════════════════════════════════════════════════════════
//  POST /webhooks/beds24 — Beds24 Webhook Receiver
// ═══════════════════════════════════════════════════════════

router.post("/beds24", async (req, res) => {
  // ── Feature flag: disabled → 204 No Content ──────────────
  if (!isFeatureEnabled("beds24Webhooks")) {
    logger.debug("Webhook received but ENABLE_BEDS24_WEBHOOKS=false — returning 204");
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  try {
    // ── Layer 1: IP allowlist check (PRIMARY) ─────────────
    if (!verifySourceIP(req)) {
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? req.socket.remoteAddress;
      logger.warn({ ip, allowlist: WEBHOOK_IP_ALLOWLIST }, "Webhook rejected — source IP not in allowlist");
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        code: ERROR_CODES.FORBIDDEN,
        message: "Source IP not in webhook allowlist",
      });
    }

    // ── Layer 2: Static shared secret check (OPTIONAL) ────
    if (WEBHOOK_SECRET && !verifySharedSecret(req)) {
      logger.warn("Webhook rejected — shared secret header mismatch");
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        code: ERROR_CODES.WEBHOOK_INVALID_SIGNATURE,
        message: "Invalid webhook secret — check Custom Header configuration in Beds24 dashboard",
      });
    }

    // ── Parse event ────────────────────────────────────────
    const parsed = webhookEventSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.message }, "Webhook payload validation failed");
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        code: ERROR_CODES.VALIDATION,
        message: "Invalid webhook payload",
      });
    }

    const event = parsed.data;
    const eventId = String(event.id);

    // ── Dedup: insert into webhook_events (UNIQUE on event_id) ─
    try {
      await db.insert(webhookEvents).values({
        eventId,
        eventType: event.type,
        source: "beds24",
        payload: req.body as Record<string, unknown>,
        status: "PENDING",
        attempts: 0,
        maxRetries: WEBHOOK_MAX_RETRIES,
      });
    } catch (err: any) {
      // UNIQUE constraint violation = duplicate event
      if (err.code === "23505" || err.message?.includes("unique") || err.message?.includes("duplicate")) {
        logger.info({ eventId }, "Webhook event deduplicated — already received");
        return res.status(HTTP_STATUS.OK).json({
          received: true,
          deduplicated: true,
          eventId,
          message: "Event already received and is being processed",
        });
      }
      throw err; // Re-throw unexpected errors
    }

    // ── Enqueue for async processing ───────────────────────
    const queue = await getQueue();
    if (queue) {
      await queue.add("process-webhook", {
        eventId,
        eventType: event.type,
        payload: req.body,
      }, {
        jobId: `webhook-${eventId}`, // Prevent duplicate jobs
        attempts: 1, // Worker handles its own retry logic via DB
      });
      logger.info({ eventId, eventType: event.type }, "Webhook event queued for processing");
    } else {
      logger.warn({ eventId }, "Webhook event stored but BullMQ unavailable — needs manual processing");
    }

    // ── Ack fast ───────────────────────────────────────────
    return res.status(HTTP_STATUS.OK).json({
      received: true,
      deduplicated: false,
      eventId,
      message: "Event received and queued for processing",
    });
  } catch (err) {
    logger.error({ err }, "Webhook processing failed");
    // Still return 200 to prevent Beds24 from retrying
    return res.status(HTTP_STATUS.OK).json({
      received: true,
      error: "Internal processing error — event may need manual review",
    });
  }
});

// ═══════════════════════════════════════════════════════════
//  GET /webhooks/status — Health check for webhook system
// ═══════════════════════════════════════════════════════════

router.get("/status", async (_req, res) => {
  res.json({
    enabled: isFeatureEnabled("beds24Webhooks"),
    behavior: isFeatureEnabled("beds24Webhooks") ? "200 + queue" : "204 no-op",
    security: {
      ipAllowlist: {
        enabled: WEBHOOK_IP_ALLOWLIST.length > 0,
        count: WEBHOOK_IP_ALLOWLIST.length,
        note: "PRIMARY — Beds24 does not sign webhooks",
      },
      sharedSecret: {
        enabled: !!WEBHOOK_SECRET,
        headerName: WEBHOOK_SECRET_HEADER,
        note: "OPTIONAL — set matching Custom Header in Beds24 dashboard",
      },
    },
    redisUrl: config.redisUrl ? "configured" : "not configured",
  });
});

export default router;
