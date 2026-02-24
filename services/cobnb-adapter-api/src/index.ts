/**
 * CoBnB Adapter API
 *
 * Thin adapter that sits between the CoBnB frontend and Hub API.
 * In standalone mode: proxies directly to Hub API with brand=COBNB.
 * In integrated mode: can also query Beds24 for real-time availability.
 *
 * Mode is determined by MODE_COBNB env var.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

const app = express();
const PORT = parseInt(process.env.PORT_COBNB_ADAPTER ?? "4001", 10);
const HUB_API_URL = process.env.HUB_API_URL ?? "http://localhost:4000";
const MODE = process.env.MODE_COBNB ?? "standalone";

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("short"));

// ─── Proxy helper ───────────────────────────────────────────
async function proxyToHub(path: string, options: RequestInit) {
  const url = `${HUB_API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await response.json();
  return { status: response.status, data };
}

// ─── Units (public, no auth) ────────────────────────────────
app.get("/api/v1/units", async (req, res) => {
  try {
    const params = new URLSearchParams({ ...req.query as any, brand: "COBNB" });
    const { status, data } = await proxyToHub(`/api/v1/units?${params}`, { method: "GET" });
    res.status(status).json(data);
  } catch (err) {
    logger.error({ err }, "Failed to proxy units search");
    res.status(502).json({ code: "PROXY_ERROR", message: "Failed to reach Hub API" });
  }
});

app.get("/api/v1/units/:id", async (req, res) => {
  try {
    const { status, data } = await proxyToHub(`/api/v1/units/${req.params.id}`, { method: "GET" });
    res.status(status).json(data);
  } catch (err) {
    res.status(502).json({ code: "PROXY_ERROR", message: "Failed to reach Hub API" });
  }
});

// ─── Bookings ───────────────────────────────────────────────
app.post("/api/v1/bookings/quote", async (req, res) => {
  try {
    const body = { ...req.body, brand: "COBNB" };
    const { status, data } = await proxyToHub("/api/v1/bookings/quote", {
      method: "POST",
      body: JSON.stringify(body),
    });
    res.status(status).json(data);
  } catch (err) {
    res.status(502).json({ code: "PROXY_ERROR", message: "Failed to reach Hub API" });
  }
});

app.post("/api/v1/bookings", async (req, res) => {
  try {
    const body = { ...req.body, brand: "COBNB" };
    const { status, data } = await proxyToHub("/api/v1/bookings", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Authorization: req.headers.authorization ?? "" },
    });
    res.status(status).json(data);
  } catch (err) {
    res.status(502).json({ code: "PROXY_ERROR", message: "Failed to reach Hub API" });
  }
});

// ─── Auth (proxy through) ───────────────────────────────────
app.post("/api/v1/auth/:action", async (req, res) => {
  try {
    const { status, data } = await proxyToHub(`/api/v1/auth/${req.params.action}`, {
      method: "POST",
      body: JSON.stringify(req.body),
    });
    res.status(status).json(data);
  } catch (err) {
    res.status(502).json({ code: "PROXY_ERROR", message: "Failed to reach Hub API" });
  }
});

// ─── Health ─────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "cobnb-adapter-api",
    mode: MODE,
    hubApiUrl: HUB_API_URL,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  logger.info(`CoBnB Adapter API running on port ${PORT} (mode: ${MODE})`);
});

export default app;
