import { Router } from "express";
import { eq, and, ilike, gte, lte, sql, desc, asc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { units, propertyPhotos } from "../db/schema.js";
import { searchParamsSchema } from "@mk/shared";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * Helper: attach cover_photo_url, photo_count, and optionally photos[]
 * to an array of unit rows.
 */
async function attachPhotos<T extends { id: string }>(
  rows: T[],
  includeAll = false,
): Promise<(T & { cover_photo_url: string | null; photo_count: number; photos?: { url: string; alt_text_en: string | null; alt_text_ar: string | null }[] })[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const allPhotos = await db
    .select()
    .from(propertyPhotos)
    .where(sql`${propertyPhotos.propertyId} = ANY(${ids}::uuid[])`)
    .orderBy(asc(propertyPhotos.sortOrder));

  const byProperty = new Map<string, typeof allPhotos>();
  for (const p of allPhotos) {
    const arr = byProperty.get(p.propertyId) ?? [];
    arr.push(p);
    byProperty.set(p.propertyId, arr);
  }

  return rows.map((row) => {
    const photos = byProperty.get(row.id) ?? [];
    const legacy = (row as any).images as string[] | undefined;
    const coverFromPhotos = photos[0]?.url ?? null;
    const coverFromLegacy = legacy?.[0] ?? null;

    return {
      ...row,
      cover_photo_url: coverFromPhotos || coverFromLegacy || null,
      photo_count: photos.length || (legacy?.length ?? 0),
      ...(includeAll
        ? {
            photos: photos.length > 0
              ? photos.map((p) => ({ url: p.url, alt_text_en: p.altTextEn, alt_text_ar: p.altTextAr }))
              : (legacy ?? []).map((url) => ({ url, alt_text_en: null, alt_text_ar: null })),
          }
        : {}),
    };
  });
}

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

    // Property type filter
    const propertyType = (req.query as any).type;
    if (propertyType) conditions.push(eq(units.propertyType, propertyType));

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
    const withPhotos = await attachPhotos(data);

    res.json({
      data: withPhotos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ code: "INTERNAL", message: "Search failed" });
  }
});

/** GET /units/:id — Public unit detail (includes full photos array). */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const unit = await db.query.units.findFirst({
      where: eq(units.id, req.params.id),
    });
    if (!unit) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Unit not found" });
    }
    const [withPhotos] = await attachPhotos([unit], true);
    res.json(withPhotos);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to fetch unit" });
  }
});

/** GET /units/manager/mine — Manager: list own properties. */
router.get("/manager/mine", requireAuth, requireRole("OWNER", "OPS_MANAGER"), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const data = await db.query.units.findMany({
      where: eq(units.managerId, userId),
      orderBy: [desc(units.createdAt)],
    });
    const withPhotos = await attachPhotos(data);
    res.json({ data: withPhotos, total: withPhotos.length });
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to fetch manager units" });
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

/** POST /units/:id/photos — Admin: add photos to a unit. */
router.post("/:id/photos", requireAuth, requireRole("ADMIN", "OPS_MANAGER"), async (req, res) => {
  try {
    const { photos } = req.body as { photos: { url: string; sort_order?: number; alt_text_en?: string; alt_text_ar?: string }[] };
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ code: "VALIDATION", message: "photos array required" });
    }
    const inserted = await db.insert(propertyPhotos).values(
      photos.map((p, i) => ({
        propertyId: req.params.id,
        url: p.url,
        sortOrder: p.sort_order ?? i,
        altTextEn: p.alt_text_en ?? null,
        altTextAr: p.alt_text_ar ?? null,
      }))
    ).returning();
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ code: "INTERNAL", message: "Failed to add photos" });
  }
});

export default router;
