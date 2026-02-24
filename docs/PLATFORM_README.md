# MK Platform — Architecture Overview

> Multi-brand property management platform built as a pnpm monorepo alongside the existing MonthlyKey application.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MK Repository                           │
│                                                             │
│  ┌──────────────────────────────────────────────┐           │
│  │  Existing MonthlyKey App (root)              │  Railway  │
│  │  client/ + server/ + drizzle/ (MySQL)        │  ◄─ LIVE  │
│  └──────────────────────────────────────────────┘           │
│                                                             │
│  ┌──────────────────────────────────────────────┐           │
│  │  Platform Layer (new)                        │           │
│  │                                              │           │
│  │  packages/                                   │           │
│  │  ├── shared/      (types, validators)        │           │
│  │  └── beds24-sdk/  (API V2 SDK)               │           │
│  │                                              │           │
│  │  services/                                   │           │
│  │  ├── hub-api/     (central API, Postgres)    │           │
│  │  ├── cobnb-adapter-api/                      │           │
│  │  ├── monthlykey-adapter-api/                 │           │
│  │  └── worker/      (BullMQ consumer)          │           │
│  │                                              │           │
│  │  apps/                                       │           │
│  │  ├── ops-web/     (cleaning & maintenance)   │           │
│  │  ├── cobnb-web/   (COBNB storefront)         │           │
│  │  └── monthlykey-web/ (MK storefront v2)      │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Additive only** — No existing files from `main` are modified
2. **Feature-flag everything** — All integrations start OFF
3. **Independent deployment** — Each service has its own Dockerfile
4. **Shared history** — Branch is merge-friendly with `main`
5. **Gradual migration** — Move to platform services one feature at a time

## Getting Started

```bash
# Clone and switch to platform branch
git clone https://github.com/raneemndmo-collab/mk.git
cd mk
git checkout platform/monorepo

# Install dependencies
pnpm install

# Start infrastructure
docker compose up -d postgres redis

# Start hub-api
pnpm --filter @mk/hub-api dev

# Start ops portal
pnpm --filter @mk/ops-web dev
```

## Documentation

- [Migration Plan](./MIGRATION_PLAN.md) — Step-by-step integration guide
- [Hub API OpenAPI Spec](../services/hub-api/openapi.yaml) — API documentation
- [Environment Variables](../.env.platform.example) — All configuration options

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Packages | TypeScript, Zod |
| Hub API | Express, Drizzle ORM, Postgres, BullMQ |
| Web Apps | React 18, Vite, Tailwind CSS, React Router |
| Infrastructure | Docker, Redis, Postgres |
| SDK | Beds24 API V2, Axios |
