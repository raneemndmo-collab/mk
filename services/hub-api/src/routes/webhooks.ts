import { Router } from "express";
import { createHmac } from "crypto";
import { config } from "../config.js";
import { isFeatureEnabled } from "../lib/feature-flags.js";
import { logger } from "../lib/logger.js";

const router = Router();

/** POST /webhooks/beds24 — Receive Beds24 webhook events. */
router.post("/beds24", async (req, res) => {
  try {
    // Check if webhooks are enabled
    const enabled = await isFeatureEnabled("ENABLE_BEDS24_WEBHOOKS");
    if (!enabled) {
      return res.status(503).json({ message: "Webhooks disabled" });
    }

    // Verify signature
    const signature = req.headers["x-beds24-signature"] as string;
    if (config.beds24.webhookSecret && signature) {
      const expected = createHmac("sha256", config.beds24.webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (signature !== expected) {
        logger.warn("Invalid Beds24 webhook signature");
        return res.status(401).json({ message: "Invalid signature" });
      }
    }

    const event = req.body;
    logger.info({ eventType: event.type, eventId: event.id }, "Beds24 webhook received");

    // Dispatch to worker queue (BullMQ)
    // TODO: Enqueue event for async processing
    // await webhookQueue.add("beds24-event", event);

    // Acknowledge immediately
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, "Webhook processing error");
    res.status(500).json({ message: "Webhook processing failed" });
  }
});

export default router;
