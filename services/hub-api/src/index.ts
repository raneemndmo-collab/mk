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

// ─── Health Check ───────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "hub-api",
    modes: config.modes,
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

// ─── Start Server ───────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`Hub API running on port ${config.port}`);
  logger.info(`Modes: CoBnB=${config.modes.cobnb}, MK=${config.modes.monthlykey}, Ops=${config.modes.ops}`);
});

export default app;
