import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { featureFlags, auditLog } from "../db/schema.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { featureFlagUpdateSchema, beds24ProxySchema } from "@mk/shared";
import { invalidateFeatureFlagCache, isFeatureEnabled } from "../lib/feature-flags.js";
import { createBeds24SDK } from "@mk/beds24-sdk";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── Feature Flags ──────────────────────────────────────────

/** GET /admin/feature-flags — List all flags. */
router.get("/feature-flags", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  try {
    const flags = await db.query.featureFlags.findMany();
    res.json(flags);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to list flags" });
  }
});

/** PUT /admin/feature-flags — Update a flag. */
router.put("/feature-flags", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const parsed = featureFlagUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }

    const { key, enabled, scope, description } = parsed.data;

    const [updated] = await db.update(featureFlags)
      .set({ enabled, scope, description: description ?? "", updatedAt: new Date() })
      .where(eq(featureFlags.key, key))
      .returning();

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Flag not found" });
    }

    invalidateFeatureFlagCache();

    // Audit log
    await db.insert(auditLog).values({
      actorUserId: req.auth!.userId,
      action: "UPDATE_FEATURE_FLAG",
      entityType: "feature_flag",
      entityId: key,
      payload: { enabled, scope },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to update flag" });
  }
});

// ─── Beds24 Admin Proxy ─────────────────────────────────────

/** POST /admin/beds24/proxy — Safe passthrough proxy. */
router.post("/beds24/proxy", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const proxyEnabled = await isFeatureEnabled("ENABLE_BEDS24_PROXY");
    if (!proxyEnabled) {
      return res.status(403).json({
        code: "FEATURE_DISABLED",
        message: "Beds24 proxy is disabled. Enable ENABLE_BEDS24_PROXY flag first.",
      });
    }

    const parsed = beds24ProxySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }

    if (!config.beds24.refreshToken) {
      return res.status(503).json({
        code: "NOT_CONFIGURED",
        message: "Beds24 refresh token not configured",
      });
    }

    const sdk = createBeds24SDK({
      apiUrl: config.beds24.apiUrl,
      refreshToken: config.beds24.refreshToken,
    });

    const { response, audit } = await sdk.adminProxy.execute(parsed.data);

    // Audit log
    await db.insert(auditLog).values({
      actorUserId: req.auth!.userId,
      action: "BEDS24_PROXY",
      entityType: "beds24",
      entityId: parsed.data.path,
      payload: audit as unknown as Record<string, unknown>,
    });

    res.status(response.status).json(response.data);
  } catch (err: any) {
    logger.error({ err }, "Beds24 proxy error");
    const status = err.statusCode ?? 500;
    res.status(status).json({ code: "PROXY_ERROR", message: err.message });
  }
});

// ─── Audit Log ──────────────────────────────────────────────

/** GET /admin/audit-log — List audit entries. */
router.get("/audit-log", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const offset = (page - 1) * limit;

    const entries = await db.query.auditLog.findMany({
      orderBy: (al, { desc }) => [desc(al.createdAt)],
      limit,
      offset,
    });

    res.json({ data: entries, page, limit });
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to list audit log" });
  }
});

export default router;
