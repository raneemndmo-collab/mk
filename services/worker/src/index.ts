/**
 * Worker Service — BullMQ Queue Consumer
 *
 * Processes async jobs:
 * - beds24-webhook: Process Beds24 webhook events
 * - auto-ticket: Automatically create cleaning/maintenance tickets on checkout
 * - notification: Send notifications (email/SMS/push)
 */

import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// ─── Queues ─────────────────────────────────────────────────
export const webhookQueue = new Queue("beds24-webhook", { connection });
export const ticketQueue = new Queue("auto-ticket", { connection });
export const notificationQueue = new Queue("notification", { connection });

// ─── Beds24 Webhook Worker ──────────────────────────────────
const webhookWorker = new Worker(
  "beds24-webhook",
  async (job) => {
    const event = job.data;
    logger.info({ eventType: event.type, jobId: job.id }, "Processing Beds24 webhook");

    switch (event.type) {
      case "booking.created":
        logger.info({ bookingId: event.bookingId }, "New booking from Beds24");
        // TODO: Sync booking to local DB
        // TODO: Auto-create cleaning ticket for checkout date
        await ticketQueue.add("auto-clean", {
          type: "CHECKOUT_CLEAN",
          bookingId: event.bookingId,
          unitId: event.propertyId,
          dueAt: event.checkOut,
        });
        break;

      case "booking.modified":
        logger.info({ bookingId: event.bookingId }, "Booking modified in Beds24");
        // TODO: Update local booking record
        break;

      case "booking.cancelled":
        logger.info({ bookingId: event.bookingId }, "Booking cancelled in Beds24");
        // TODO: Cancel local booking, cancel related tickets
        break;

      case "property.updated":
        logger.info({ propertyId: event.propertyId }, "Property updated in Beds24");
        // TODO: Sync property changes to local DB
        break;

      default:
        logger.warn({ eventType: event.type }, "Unknown Beds24 event type");
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  }
);

// ─── Auto-Ticket Worker ─────────────────────────────────────
const ticketWorker = new Worker(
  "auto-ticket",
  async (job) => {
    const { type, bookingId, unitId, dueAt } = job.data;
    logger.info({ type, bookingId, unitId }, "Creating auto-ticket");

    // TODO: Call Hub API to create ticket
    // POST /api/v1/tickets { type: "CHECKOUT_CLEAN", unitId, bookingId, dueAt }

    // For now, log the intent
    logger.info(
      { type, unitId, dueAt },
      "Would create cleaning ticket for checkout"
    );
  },
  {
    connection,
    concurrency: 3,
  }
);

// ─── Notification Worker ────────────────────────────────────
const notificationWorker = new Worker(
  "notification",
  async (job) => {
    const { channel, recipient, subject, body } = job.data;
    logger.info({ channel, recipient, subject }, "Sending notification");

    switch (channel) {
      case "email":
        // TODO: Integrate with email service (SendGrid, SES, etc.)
        logger.info({ recipient }, "Would send email notification");
        break;
      case "sms":
        // TODO: Integrate with SMS service (Twilio, Unifonic, etc.)
        logger.info({ recipient }, "Would send SMS notification");
        break;
      case "push":
        // TODO: Integrate with push notification service
        logger.info({ recipient }, "Would send push notification");
        break;
      default:
        logger.warn({ channel }, "Unknown notification channel");
    }
  },
  {
    connection,
    concurrency: 10,
  }
);

// ─── Graceful Shutdown ──────────────────────────────────────
async function shutdown() {
  logger.info("Shutting down workers...");
  await Promise.all([
    webhookWorker.close(),
    ticketWorker.close(),
    notificationWorker.close(),
  ]);
  await connection.quit();
  logger.info("Workers shut down gracefully");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// ─── Worker Event Handlers ──────────────────────────────────
for (const [name, worker] of Object.entries({
  webhook: webhookWorker,
  ticket: ticketWorker,
  notification: notificationWorker,
})) {
  worker.on("completed", (job) => {
    logger.info({ worker: name, jobId: job.id }, "Job completed");
  });
  worker.on("failed", (job, err) => {
    logger.error({ worker: name, jobId: job?.id, err: err.message }, "Job failed");
  });
}

logger.info("Worker service started — listening for jobs on 3 queues");
logger.info(`Redis: ${REDIS_URL}`);
