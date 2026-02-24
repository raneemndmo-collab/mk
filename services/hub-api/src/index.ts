import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";

// Routes
import authRoutes from "./routes/auth.js";
import unitsRoutes from "./routes/units.js";
import bookingsRoutes from "./routes/bookings.js";
import ticketsRoutes from "./routes/tickets.js";
import adminRoutes from "./routes/admin.js";
import webhooksRoutes from "./routes/webhooks.js";

const app = express();

// ─── Global Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("short"));

// ─── Rate Limiting ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { code: "TOO_MANY_REQUESTS", message: "Too many auth attempts" },
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { code: "TOO_MANY_REQUESTS", message: "Too many search requests" },
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
});

app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/units", searchLimiter);
app.use("/api/v1", generalLimiter);

// ─── API Routes ─────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/units", unitsRoutes);
app.use("/api/v1/bookings", bookingsRoutes);
app.use("/api/v1/tickets", ticketsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/webhooks", webhooksRoutes);

// ─── Health Check (liveness) ──────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "hub-api",
    version: process.env.npm_package_version ?? "1.0.0",
    modes: config.modes,
    features: config.features,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Readiness Check (startup dependencies) ───────────────
app.get("/ready", async (_req, res) => {
  const checks: Record<string, boolean> = {};
  let allReady = true;

  // DB connectivity
  try {
    const { db: dbConn } = await import("./db/connection.js");
    await dbConn.execute("SELECT 1" as any);
    checks.database = true;
  } catch {
    checks.database = false;
    allReady = false;
  }

  // Redis connectivity (only if webhooks or worker features enabled)
  if (config.features.beds24Webhooks) {
    try {
      const net = await import("net");
      const url = new URL(config.redisUrl.startsWith("redis://") ? config.redisUrl : `redis://${config.redisUrl}`);
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection(parseInt(url.port || "6379"), url.hostname);
        socket.setTimeout(2000);
        socket.on("connect", () => { socket.destroy(); resolve(); });
        socket.on("error", reject);
        socket.on("timeout", () => { socket.destroy(); reject(new Error("timeout")); });
      });
      checks.redis = true;
    } catch {
      checks.redis = false;
      allReady = false;
    }
  }

  // Beds24 SDK (only if ENABLE_BEDS24=true)
  if (config.features.beds24) {
    checks.beds24Token = !!config.beds24.refreshToken;
    if (!checks.beds24Token) allReady = false;
  }

  const status = allReady ? 200 : 503;
  res.status(status).json({
    ready: allReady,
    service: "hub-api",
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ─── Metrics (basic operational counters) ─────────────────
app.get("/metrics", (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    service: "hub-api",
    uptime_seconds: Math.floor(process.uptime()),
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    modes: config.modes,
    features: config.features,
    node_version: process.version,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "Endpoint not found" });
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ code: "INTERNAL", message: "Internal server error" });
});

// ─── Startup Validation ────────────────────────────────────
//
// Warn immediately on boot if webhook secret rotation is
// misconfigured. This catches operator mistakes right after deploy
// instead of silently rejecting webhooks at runtime.
//

function validateWebhookSecretConfig(): void {
  const previous = process.env.BEDS24_WEBHOOK_SECRET_PREVIOUS;
  const rotationStart = process.env.BEDS24_WEBHOOK_SECRET_ROTATION_START;
  const secret = process.env.BEDS24_WEBHOOK_SECRET;

  if (previous && !rotationStart) {
    logger.error(
      "⚠️  MISCONFIGURATION: BEDS24_WEBHOOK_SECRET_PREVIOUS is set but BEDS24_WEBHOOK_SECRET_ROTATION_START is MISSING. " +
      "Strict mode will REJECT the previous secret. Set ROTATION_START to a valid ISO 8601 date to activate the rotation window."
    );
  }

  if (previous && rotationStart) {
    const startDate = new Date(rotationStart);
    if (isNaN(startDate.getTime())) {
      logger.error(
        `⚠️  MISCONFIGURATION: BEDS24_WEBHOOK_SECRET_ROTATION_START="${rotationStart}" is not a valid ISO 8601 date. ` +
        "Strict mode will REJECT the previous secret. Fix the date format (e.g. 2026-03-01T00:00:00Z)."
      );
    } else {
      const windowDays = parseInt(process.env.BEDS24_WEBHOOK_SECRET_ROTATION_WINDOW_DAYS ?? "7", 10);
      const windowEndMs = startDate.getTime() + windowDays * 24 * 60 * 60 * 1000;
      const now = Date.now();

      if (now > windowEndMs) {
        logger.warn(
          `⚠️  CLEANUP NEEDED: Webhook secret rotation window expired ${Math.floor((now - windowEndMs) / 86400000)} days ago. ` +
          "Clear BEDS24_WEBHOOK_SECRET_PREVIOUS and BEDS24_WEBHOOK_SECRET_ROTATION_START from .env, then redeploy."
        );
      } else {
        const daysLeft = Math.ceil((windowEndMs - now) / 86400000);
        logger.info(
          `✅  Webhook secret rotation active — ${daysLeft} day(s) remaining. Both current and previous secrets are accepted.`
        );
      }
    }
  }

  if (!secret && !previous) {
    if (config.features.beds24Webhooks) {
      logger.warn(
        "⚠️  BEDS24_WEBHOOK_SECRET is not configured but ENABLE_BEDS24_WEBHOOKS=true. " +
        "Webhooks will be accepted WITHOUT shared secret verification. Set BEDS24_WEBHOOK_SECRET for production."
      );
    }
  }
}

// ─── Start Server ───────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`Hub API running on port ${config.port}`);
  logger.info(`Modes: CoBnB=${config.modes.cobnb}, MK=${config.modes.monthlykey}, Ops=${config.modes.ops}`);
  validateWebhookSecretConfig();
});

export default app;
