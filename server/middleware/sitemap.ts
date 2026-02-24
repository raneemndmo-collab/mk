/**
 * Dynamic Sitemap Generator
 * Generates a sitemap.xml on-the-fly containing all public pages.
 * This helps search engines discover and index all important pages.
 */
import type { Request, Response } from "express";
import { getDb } from "../db";
import { properties, cities } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.PUBLIC_URL || "https://mk-production-7730.up.railway.app";

export async function sitemapHandler(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();

    // Static pages
    const staticPages = [
      { loc: "/", changefreq: "daily", priority: "1.0" },
      { loc: "/search", changefreq: "daily", priority: "0.9" },
      { loc: "/faq", changefreq: "monthly", priority: "0.5" },
      { loc: "/terms", changefreq: "monthly", priority: "0.3" },
      { loc: "/privacy", changefreq: "monthly", priority: "0.3" },
    ];

    // Dynamic pages: published properties
    let propertyPages: Array<{ loc: string; changefreq: string; priority: string }> = [];
    let cityPages: Array<{ loc: string; changefreq: string; priority: string }> = [];

    if (db) {
      try {
        const allProperties = await db
          .select({ id: properties.id })
          .from(properties)
          .where(eq(properties.status, "active"))
          .limit(5000);

        propertyPages = allProperties.map((p) => ({
          loc: `/property/${p.id}`,
          changefreq: "weekly",
          priority: "0.8",
        }));

        const allCities = await db
          .select({ id: cities.id, slug: cities.nameEn })
          .from(cities)
          .limit(100);

        cityPages = allCities.map((c) => ({
          loc: `/search?city=${c.id}`,
          changefreq: "weekly",
          priority: "0.7",
        }));
      } catch (dbErr) {
        console.warn("[Sitemap] DB query failed, generating static-only sitemap:", dbErr);
      }
    }

    const allPages = [...staticPages, ...propertyPages, ...cityPages];
    const today = new Date().toISOString().split("T")[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.status(200).send(xml);
  } catch (err) {
    console.error("[Sitemap] Error generating sitemap:", err);
    res.status(500).send("Error generating sitemap");
  }
}
