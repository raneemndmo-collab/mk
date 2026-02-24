import { Router } from "express";
import { eq, and, ilike, gte, lte, sql, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { units } from "../db/schema.js";
import { searchParamsSchema } from "@mk/shared";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/** GET /units — Public search (no login required). */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const parsed = searchParamsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ code: "VALIDATION", message: parsed.error.message });
    }

    const { brand, city, zone, minPrice, maxPrice, bedrooms, guests, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = [eq(units.status, "ACTIVE")];

    // Filter by brand channel
    conditions.push(
      sql`${units.channelsEnabled}::jsonb @> ${JSON.stringify([brand])}::jsonb`
    );

    if (city) conditions.push(ilike(units.city, `%${city}%`));
    if (zone) conditions.push(ilike(units.zone, `%${zone}%`));
    if (bedrooms !== undefined) conditions.push(gte(units.bedrooms, bedrooms));
    if (guests !== undefined) conditions.push(gte(units.maxGuests, guests));

    if (brand === "MONTHLYKEY") {
      if (minPrice !== undefined) conditions.push(gte(units.monthlyPrice, minPrice));
      if (maxPrice !== undefined) conditions.push(lte(units.monthlyPrice, maxPrice));
    } else {
      if (minPrice !== undefined) conditions.push(gte(units.dailyPrice, minPrice));
      if (maxPrice !== undefined) conditions.push(lte(units.dailyPrice, maxPrice));
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
      db.query.units.findMany({
        where,
        orderBy: [desc(units.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` }).from(units).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Search failed" });
  }
});

/** GET /units/:id — Public unit detail. */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const unit = await db.query.units.findFirst({
      where: eq(units.id, req.params.id),
    });
    if (!unit) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Unit not found" });
    }
    res.json(unit);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to fetch unit" });
  }
});

/** POST /units — Admin only: create unit. */
router.post("/", requireAuth, requireRole("ADMIN", "OPS_MANAGER"), async (req, res) => {
  try {
    const [unit] = await db.insert(units).values(req.body).returning();
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to create unit" });
  }
});

/** PUT /units/:id — Admin only: update unit. */
router.put("/:id", requireAuth, requireRole("ADMIN", "OPS_MANAGER"), async (req, res) => {
  try {
    const [updated] = await db.update(units)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(units.id, req.params.id))
      .returning();
    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Unit not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to update unit" });
  }
});

export default router;
