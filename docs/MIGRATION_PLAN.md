# MK Platform — Migration & Incremental Integration Plan

> **Goal:** Merge `platform/monorepo` into `main` when ready, with zero downtime and minimal risk.

---

## 1. Current State

### Branch: `main` (Production — Railway)
```
/                          ← Root = MonthlyKey app
├── client/                ← React 19 + Tailwind 4 + shadcn/ui (SPA)
├── server/                ← Express + tRPC + Drizzle ORM (MySQL)
├── shared/                ← Shared types/constants
├── drizzle/               ← MySQL schema + migrations
├── package.json           ← Single package (monthly-rental-platform)
├── Dockerfile             ← Railway deployment
├── railway.toml           ← Railway config
└── vite.config.ts         ← Vite build config
```

### Branch: `platform/monorepo` (Development)
```
/                          ← Same root = MonthlyKey app (UNCHANGED)
├── client/                ← UNCHANGED from main
├── server/                ← UNCHANGED from main
├── shared/                ← UNCHANGED from main
├── drizzle/               ← UNCHANGED from main
├── package.json           ← UNCHANGED from main
│
├── packages/              ← NEW: Shared platform packages
│   ├── shared/            ← Platform-wide types, validators, constants
│   └── beds24-sdk/        ← Beds24 API V2 SDK
│
├── services/              ← NEW: Platform microservices
│   ├── hub-api/           ← Central API (Express + Drizzle + Postgres)
│   ├── cobnb-adapter-api/ ← COBNB adapter (mode-locked)
│   ├── monthlykey-adapter-api/ ← MK adapter (mode-locked)
│   └── worker/            ← BullMQ queue consumer
│
├── apps/                  ← NEW: Platform web apps
│   ├── ops-web/           ← Cleaning & Maintenance portal
│   ├── cobnb-web/         ← COBNB public storefront
│   └── monthlykey-web/    ← Monthly Key storefront (future replacement)
│
├── pnpm-workspace.yaml    ← NEW: Workspace config
├── docker-compose.yml     ← NEW: Local dev stack
└── .env.platform.example  ← NEW: Platform env template
```

**Key principle:** The existing MonthlyKey app at root is 100% untouched. All new code is additive.

---

## 2. Why This Approach Is Safe

| Concern | Mitigation |
|---------|-----------|
| Railway deployment breaks | Root `package.json`, `Dockerfile`, `railway.toml` are **unchanged** — Railway sees the same build |
| pnpm-workspace.yaml conflicts | pnpm workspaces only activate when you `pnpm install` from root with workspace members. The existing `pnpm-lock.yaml` still works for the root app |
| Merge conflicts | All new code is in **new directories** (`packages/`, `services/`, `apps/`). No existing file is modified |
| Database conflicts | New services use **Postgres** (separate DB). Existing app uses **MySQL**. No schema overlap |
| Port conflicts | New services use ports 4000-4003. Existing app uses port 3000 (or Railway's PORT) |

---

## 3. Incremental Integration Steps

### Phase 0: Merge the Branch (Safe — No Production Impact)
```bash
git checkout main
git merge platform/monorepo
git push origin main
```

**What happens:** Railway redeploys the existing MonthlyKey app. It ignores `packages/`, `services/`, `apps/` because they're not referenced by the root `package.json` or `Dockerfile`. **Zero impact.**

---

### Phase 1: Deploy Hub API Independently
**Timeline:** 1-2 weeks after merge

1. Create a new Railway service for `services/hub-api`
2. Provision a Postgres database on Railway
3. Set environment variables from `.env.platform.example`
4. Configure the Dockerfile path: `services/hub-api/Dockerfile`
5. Run migrations: `pnpm --filter @mk/hub-api db:migrate`
6. Seed initial data: `pnpm --filter @mk/hub-api db:seed`

**Verification:**
- `GET /api/v1/health` returns `200`
- `GET /api/v1/units` returns empty array
- Feature flags all OFF

**Rollback:** Delete the Railway service. No impact on main app.

---

### Phase 2: Connect Beds24 (Feature Flag Gated)
**Timeline:** 1-2 weeks after Phase 1

1. Add Beds24 credentials to hub-api environment
2. Toggle: `ENABLE_BEDS24=true`
3. Test property sync: `GET /api/v1/units` should return Beds24 properties
4. Toggle: `ENABLE_BEDS24_WEBHOOKS=true`
5. Configure Beds24 webhook URL → `https://hub-api.railway.app/api/v1/webhooks/beds24`

**Verification:**
- Properties appear in hub-api
- Webhook events are received and logged
- Worker processes events (deploy worker service)

**Rollback:** Set `ENABLE_BEDS24=false`. Hub-api returns to standalone mode.

---

### Phase 3: Deploy Ops Portal
**Timeline:** 1 week after Phase 2

1. Deploy `apps/ops-web` as a static site (Vercel/Netlify/Railway)
2. Configure `VITE_API_URL` to point to hub-api
3. Create ops staff accounts via hub-api admin endpoint
4. Test ticket creation, assignment, checklist workflows

**Verification:**
- Ops staff can log in
- Tickets can be created manually
- If `ENABLE_AUTOMATED_TICKETS=true`, checkout webhooks auto-create cleaning tickets

**Rollback:** Take down ops-web. No impact on other services.

---

### Phase 4: Deploy COBNB Storefront
**Timeline:** 2-3 weeks after Phase 3

1. Deploy `apps/cobnb-web` as a static site
2. Deploy `services/cobnb-adapter-api` on Railway
3. Configure adapter to point to hub-api
4. Test browsing, search, unit detail pages
5. Test booking flow (requires `ENABLE_PAYMENTS=false` initially)

**Verification:**
- Units with `bookingMode: COBNB` or `DUAL` appear
- Booking creates a record in hub-api
- Mode-lock prevents accessing MONTHLY_KEY-only units

**Rollback:** Take down cobnb-web + adapter. No impact.

---

### Phase 5: Migrate MonthlyKey to Platform (Gradual)
**Timeline:** 4-6 weeks after Phase 4

This is the most complex phase. Two strategies:

#### Strategy A: Parallel Run (Recommended)
1. Deploy `apps/monthlykey-web` alongside the existing root app
2. Deploy `services/monthlykey-adapter-api`
3. Both apps run simultaneously — old app on `monthlykey.com`, new app on `new.monthlykey.com`
4. Gradually migrate users via feature flags
5. When confident, swap DNS: `monthlykey.com` → new app
6. Decommission old root app

#### Strategy B: In-Place Evolution
1. Gradually refactor `client/` to import from `packages/shared`
2. Add hub-api calls alongside existing tRPC calls
3. Feature-flag each integration point
4. Eventually remove tRPC routes as hub-api takes over

**Recommendation:** Strategy A is safer because it doesn't modify the production app.

---

### Phase 6: Enable Payments
**Timeline:** After Phase 5 is stable

1. Set up Moyasar account and get API keys
2. Toggle: `ENABLE_PAYMENTS=true`
3. Test card payments in sandbox mode
4. Toggle: `ENABLE_BANK_TRANSFER=true` for bank transfer option
5. Go live with production Moyasar keys

---

### Phase 7: Cleanup (Optional)
**Timeline:** After all services are stable for 2+ weeks

1. Remove old `client/`, `server/`, `shared/`, `drizzle/` from root
2. Move root `package.json` scripts to workspace root
3. Update `Dockerfile` to build from workspace
4. Update `railway.toml` for multi-service deployment
5. Archive MySQL database after data migration to Postgres

---

## 4. Feature Flag Reference

All flags default to `false`. Enable one at a time:

| Flag | Phase | What It Enables |
|------|-------|----------------|
| `ENABLE_BEDS24` | 2 | Beds24 API integration (property sync) |
| `ENABLE_BEDS24_WEBHOOKS` | 2 | Webhook processing for bookings/checkout |
| `ENABLE_BEDS24_PROXY` | 2 | Admin proxy to Beds24 dashboard |
| `ENABLE_AUTOMATED_TICKETS` | 3 | Auto-create cleaning tickets on checkout |
| `ENABLE_PAYMENTS` | 6 | Moyasar payment processing |
| `ENABLE_BANK_TRANSFER` | 6 | Bank transfer payment option |

---

## 5. Database Strategy

| Service | Database | Reason |
|---------|----------|--------|
| Existing MK app (root) | **MySQL** (Railway) | Already in production, don't touch |
| Hub API + new services | **Postgres** (new Railway DB) | Fresh start, better JSON support, Drizzle Postgres |

**Data migration** (Phase 5-7): Write a migration script that reads from MySQL and writes to Postgres. Run it once when switching over.

---

## 6. Merge Conflict Prevention

### Rules for Development
1. **Never modify existing files** in `platform/monorepo` — only add new files in `packages/`, `services/`, `apps/`
2. If you need to change a root file (e.g., `.gitignore`), make the change in **both branches** simultaneously
3. Use `git merge main` into `platform/monorepo` regularly to stay in sync
4. Before merging to main, always run: `git merge-base main platform/monorepo` to verify shared history

### Safe Merge Checklist
```bash
# 1. Ensure branch is up to date with main
git checkout platform/monorepo
git merge main  # Resolve any conflicts here

# 2. Verify no existing files are modified
git diff main..platform/monorepo --name-only --diff-filter=M
# Should show 0 files (or only intentional changes)

# 3. Verify only additions
git diff main..platform/monorepo --name-only --diff-filter=A
# Should show only files in packages/, services/, apps/, docs/

# 4. Merge
git checkout main
git merge platform/monorepo --no-ff -m "Merge platform monorepo scaffold"
git push origin main
```

---

## 7. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Railway build fails after merge | Very Low | High | Root Dockerfile unchanged; test with `docker build .` before merge |
| pnpm install conflicts | Low | Medium | Lock file only changes if you run `pnpm install` at root |
| Port collision in dev | Low | Low | Each service has unique port in `.env.platform.example` |
| Beds24 API rate limits | Medium | Medium | SDK has built-in retry with backoff |
| Data inconsistency during migration | Medium | High | Run parallel systems; validate data before DNS switch |

---

## 8. Quick Reference Commands

```bash
# Work on platform branch
git checkout platform/monorepo

# Sync with main
git merge main

# Install all workspace dependencies
pnpm install

# Start only the existing MK app (same as before)
pnpm dev

# Start hub-api
pnpm --filter @mk/hub-api dev

# Start ops portal
pnpm --filter @mk/ops-web dev

# Start all new services
docker compose up -d postgres redis
pnpm --filter @mk/hub-api dev &
pnpm --filter @mk/worker dev &
pnpm --filter @mk/ops-web dev &

# Run tests
pnpm --filter @mk/hub-api test
pnpm --filter @mk/shared test
pnpm --filter @mk/beds24-sdk test
```
