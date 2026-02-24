# Railway Deploy Guide — Location Resolve

> This guide covers the staging environment variables and deployment steps required to activate the **Location Resolve** feature across all MK platform services on Railway.

---

## Architecture Overview

The Location Resolve feature spans three Railway services and three frontend apps. The data flow is:

```
Frontend (MK / CoBnB / Ops)
  → POST /api/v1/location/resolve
  → Adapter API (proxy)
  → Hub API (resolve + cache)
  → Google Places / Geocoding API (external)
  → Redis (fast cache, 30-day TTL)
  → Postgres (persistent cache, 30-day TTL)
```

All cache operations use **graceful degradation**: if Redis is down, Postgres is used as fallback. If both are down, the resolve still works — it just skips caching.

---

## Staging Environment Variables

### Hub API (`hub-api`)

These are the variables that must be set on the **hub-api** Railway service.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_LOCATION_RESOLVE` | **Yes** | `false` | Master switch. Must be `true` to accept resolve requests. |
| `ENABLE_GOOGLE_MAPS` | **Yes** | `false` | Enables Google Maps API calls (geocoding, reverse geocoding, Places Details). |
| `GOOGLE_MAPS_API_KEY` | **Yes** | `""` | Google Cloud API key with Places API + Geocoding API enabled. **Never logged.** |
| `DATABASE_URL` | **Yes** | — | Postgres connection string. Required for persistent cache table `location_resolve_cache`. |
| `REDIS_URL` | Recommended | `redis://localhost:6379` | Redis connection string. Required for fast-path cache. Falls back to Postgres if unavailable. |
| `LOCATION_RESOLVE_RATE_LIMIT` | No | `20` | Max requests per minute per IP address. |
| `ENABLE_MAPBOX_MAPS` | No | `false` | Optional Mapbox fallback (not used in current pipeline, reserved for future). |
| `MAPBOX_PUBLIC_TOKEN` | No | `""` | Mapbox token (only if `ENABLE_MAPBOX_MAPS=true`). |

### CoBnB Adapter API (`cobnb-adapter-api`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HUB_API_URL` | **Yes** | `http://localhost:4000` | Internal URL of hub-api. The adapter proxies `/api/v1/location/*` to this URL. |
| `MODE_COBNB` | **Yes** | `standalone` | Operation mode (`standalone` or `integrated`). |
| `PORT_COBNB_ADAPTER` | No | `4001` | Port the adapter listens on. |

### Monthly Key Adapter API (`monthlykey-adapter-api`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HUB_API_URL` | **Yes** | `http://localhost:4000` | Internal URL of hub-api. The adapter proxies `/api/v1/location/*` to this URL. |
| `MODE_MONTHLYKEY` | **Yes** | `standalone` | Operation mode (`standalone` or `integrated`). |
| `PORT_MK_ADAPTER` | No | `4002` | Port the adapter listens on. |

### Frontend Apps (monthlykey-web / cobnb-web / ops-web)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `/api/v1` | API base URL. Only needed if the frontend is served from a different domain than the adapter. |

---

## Google Cloud API Key Setup

The `GOOGLE_MAPS_API_KEY` must have the following APIs enabled in Google Cloud Console:

| API | Used For |
|-----|----------|
| **Places API (New)** | `placeDetailsViaGoogle()` — resolving place_id to coordinates + address |
| **Geocoding API** | `reverseGeocodeViaGoogle()` — converting coordinates to formatted address |
| **Geocoding API** | `geocodeViaGoogle()` — converting place name to coordinates |

**Recommended restrictions:**

- **Application restriction:** IP addresses (add Railway's outbound IPs)
- **API restriction:** Limit to Places API + Geocoding API only
- **Quota:** Set a daily quota limit to prevent unexpected billing

---

## Database Migration

The `location_resolve_cache` table must exist in Postgres before the cache layer works. The schema is already defined in `services/hub-api/src/db/schema.ts`.

```bash
# From the hub-api service directory:
npx drizzle-kit push

# Or generate + apply migration:
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Table structure:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `url_hash` | VARCHAR(64) | SHA-256 hash of normalized URL (unique index) |
| `original_url` | TEXT | The URL submitted by the user |
| `final_url` | TEXT | The expanded URL after redirect resolution |
| `lat` | NUMERIC(10,7) | Latitude |
| `lng` | NUMERIC(10,7) | Longitude |
| `formatted_address` | TEXT | Human-readable address |
| `place_id` | VARCHAR(200) | Google Place ID (nullable) |
| `resolved_via` | VARCHAR(50) | Resolution method: `url_parse`, `google_geocode`, `google_place` |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |
| `expires_at` | TIMESTAMPTZ | Cache expiry (30 days from creation) |

**Indexes:**
- `loc_cache_url_hash_idx` — unique index on `url_hash` (cache lookup)
- `loc_cache_expires_idx` — index on `expires_at` (cleanup queries)

---

## Redis Configuration

Railway provides a Redis plugin that auto-injects `REDIS_URL`. If using an external Redis:

- **Minimum version:** Redis 6.0+
- **Memory:** 50MB is sufficient for ~100K cached locations
- **Persistence:** Not required (Postgres is the source of truth)
- **TLS:** Supported via `rediss://` URL scheme

Cache key format: `mk:loc:{sha256_hash}` with TTL of 2,592,000 seconds (30 days).

---

## Deployment Steps

### 1. Set Environment Variables

Add all required variables to each Railway service. At minimum:

```env
# hub-api
ENABLE_LOCATION_RESOLVE=true
ENABLE_GOOGLE_MAPS=true
GOOGLE_MAPS_API_KEY=AIza...your-key...
DATABASE_URL=postgresql://...  (already set if DB exists)
REDIS_URL=redis://...          (auto-injected by Railway Redis plugin)

# cobnb-adapter-api
HUB_API_URL=http://hub-api.railway.internal:4000

# monthlykey-adapter-api
HUB_API_URL=http://hub-api.railway.internal:4000
```

### 2. Run Database Migration

```bash
# In hub-api service shell:
npx drizzle-kit push
```

### 3. Deploy Services

Deploy in this order to avoid dependency issues:

1. **hub-api** — the core service with cache + resolve logic
2. **cobnb-adapter-api** — proxy layer for CoBnB frontend
3. **monthlykey-adapter-api** — proxy layer for Monthly Key frontend
4. **Frontend apps** — static builds, deploy last

### 4. Verify

```bash
# Check feature status:
curl https://hub-api.your-domain.com/api/v1/location/status

# Expected response:
{
  "enabled": true,
  "googleMaps": { "enabled": true, "apiKeyConfigured": true },
  "mapbox": { "enabled": false, "tokenConfigured": false },
  "rateLimit": { "maxRequestsPerMinute": 20 },
  "cacheTtlDays": 30
}

# Test resolve:
curl -X POST https://hub-api.your-domain.com/api/v1/location/resolve \
  -H "Content-Type: application/json" \
  -d '{"google_maps_url": "https://maps.app.goo.gl/your-test-link"}'

# Expected response includes:
# lat, lng, formatted_address, place_id, degraded, resolution_quality, resolved_via, cached
```

### 5. Monitor

Key log events to watch for:

| Event | Meaning |
|-------|---------|
| `location_resolved` | Fresh resolve succeeded |
| `location_cache_hit` | Cache hit (Redis or Postgres) |
| `location_resolve_error` | Resolve failed |
| `location_place_details_success` | Place Details API call succeeded |
| `location_place_details_error` | Place Details API call failed (falls back to coord parsing) |

---

## Rollback

To disable Location Resolve without redeploying:

```env
ENABLE_LOCATION_RESOLVE=false
```

This immediately returns HTTP 503 for all `/location/resolve` requests. No code change or redeploy needed — just update the Railway variable and the service picks it up on next request.

---

## Security Checklist

- [ ] `GOOGLE_MAPS_API_KEY` is set as a Railway secret (not in code or logs)
- [ ] API key has IP restriction in Google Cloud Console
- [ ] API key is limited to Places API + Geocoding API only
- [ ] `REDIS_URL` uses TLS (`rediss://`) in production
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`) in production
- [ ] Rate limit is set appropriately (`LOCATION_RESOLVE_RATE_LIMIT`)
