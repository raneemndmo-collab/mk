/**
 * Server-side proxy for monthlykey.com tRPC API
 * Forwards /api/mk/* → https://monthlykey.com/api/trpc/*
 * This avoids CORS issues in both dev and production
 */

import type { Express, Request, Response } from "express";
import axios from "axios";

const MK_API_BASE = "https://monthlykey.com/api/trpc";

// Cache for batch-fetched properties (TTL: 5 minutes)
let propertyCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchPropertyById(id: number): Promise<any | null> {
  try {
    const input = encodeURIComponent(JSON.stringify({ json: { id } }));
    const resp = await axios.get(`${MK_API_BASE}/property.getById?input=${input}`, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      timeout: 8000,
    });
    const property = resp.data?.result?.data?.json;
    return property || null;
  } catch {
    return null;
  }
}

async function getBatchProperties(): Promise<any[]> {
  // Return cached data if still fresh
  if (propertyCache && Date.now() - propertyCache.timestamp < CACHE_TTL_MS) {
    return propertyCache.data;
  }

  // Fetch properties by individual IDs (1-500) in parallel batches
  const allProperties: any[] = [];
  const batchSize = 25;
  const maxId = 500;

  for (let start = 1; start <= maxId; start += batchSize) {
    const ids = Array.from({ length: Math.min(batchSize, maxId - start + 1) }, (_, i) => start + i);
    const results = await Promise.allSettled(ids.map(fetchPropertyById));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        allProperties.push(r.value);
      }
    }
    // Stop early if we get a batch of all nulls (no more properties)
    const batchResults = results.filter(r => r.status === "fulfilled" && (r as any).value !== null);
    if (batchResults.length === 0 && start > 50) break;
  }

  propertyCache = { data: allProperties, timestamp: Date.now() };
  console.log(`[MK Proxy] Cached ${allProperties.length} properties from batch fetch`);
  return allProperties;
}

export function registerMkProxy(app: Express) {
  // Fallback batch-fetch endpoint: /api/mk-batch/properties
  app.get("/api/mk-batch/properties", async (_req: Request, res: Response) => {
    try {
      const properties = await getBatchProperties();
      res.json({
        result: {
          data: {
            json: properties,
          },
        },
      });
    } catch (error: any) {
      console.error("[MK Proxy] Batch fetch error:", error?.message);
      res.status(500).json({ error: "Batch fetch failed", message: error?.message });
    }
  });

  // Fallback search endpoint: /api/mk-batch/search
  app.get("/api/mk-batch/search", async (req: Request, res: Response) => {
    try {
      const properties = await getBatchProperties();
      let filtered = [...properties];

      // Apply filters from query params
      const { query, city, propertyType, minPrice, maxPrice, bedrooms, furnishedLevel, limit, offset } = req.query;

      if (query) {
        const q = String(query).toLowerCase();
        filtered = filtered.filter(p =>
          (p.titleAr || "").toLowerCase().includes(q) ||
          (p.titleEn || "").toLowerCase().includes(q) ||
          (p.cityAr || "").toLowerCase().includes(q) ||
          (p.city || "").toLowerCase().includes(q) ||
          (p.districtAr || "").toLowerCase().includes(q) ||
          (p.district || "").toLowerCase().includes(q)
        );
      }
      if (city) {
        const c = String(city).toLowerCase();
        filtered = filtered.filter(p =>
          (p.cityAr || "").toLowerCase() === c ||
          (p.city || "").toLowerCase() === c
        );
      }
      if (propertyType) {
        filtered = filtered.filter(p => p.propertyType === String(propertyType));
      }
      if (minPrice) {
        filtered = filtered.filter(p => parseFloat(p.monthlyRent) >= Number(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter(p => parseFloat(p.monthlyRent) <= Number(maxPrice));
      }
      if (bedrooms) {
        filtered = filtered.filter(p => p.bedrooms >= Number(bedrooms));
      }
      if (furnishedLevel) {
        filtered = filtered.filter(p => p.furnishedLevel === String(furnishedLevel));
      }

      const total = filtered.length;
      const off = Number(offset) || 0;
      const lim = Number(limit) || 20;
      const items = filtered.slice(off, off + lim);

      res.json({
        result: {
          data: {
            json: { items, total },
          },
        },
      });
    } catch (error: any) {
      console.error("[MK Proxy] Batch search error:", error?.message);
      res.status(500).json({ error: "Batch search failed", message: error?.message });
    }
  });

  // Proxy GET requests: /api/mk/:procedure
  app.get("/api/mk/:procedure", async (req: Request, res: Response) => {
    try {
      const { procedure } = req.params;
      const queryString = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
      const targetUrl = `${MK_API_BASE}/${procedure}${queryString}`;

      const response = await axios.get(targetUrl, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        timeout: 15000,
      });

      res.json(response.data);
    } catch (error: any) {
      console.error(`[MK Proxy] Error proxying ${req.params.procedure}:`, error?.message);
      const status = error?.response?.status || 502;
      res.status(status).json({
        error: "Proxy error",
        message: error?.message || "Failed to reach monthlykey.com API",
      });
    }
  });

  // Proxy POST requests: /api/mk/:procedure
  app.post("/api/mk/:procedure", async (req: Request, res: Response) => {
    try {
      const { procedure } = req.params;
      const targetUrl = `${MK_API_BASE}/${procedure}`;

      const response = await axios.post(targetUrl, req.body, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        timeout: 15000,
      });

      res.json(response.data);
    } catch (error: any) {
      console.error(`[MK Proxy] Error proxying POST ${req.params.procedure}:`, error?.message);
      const status = error?.response?.status || 502;
      res.status(status).json({
        error: "Proxy error",
        message: error?.message || "Failed to reach monthlykey.com API",
      });
    }
  });

  console.log("[MK Proxy] Registered /api/mk/* → monthlykey.com/api/trpc/*");
}
