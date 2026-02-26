# MonthlyKey — Security Threat Model

**Version:** 2.0  
**Date:** 2026-02-26  
**Classification:** Internal — Engineering & Security Teams  
**Scope:** Main application (Express + tRPC + React) and Hub-API micro-service  
**Compliance note:** No Beds24 changes. No Mansun dependency added.

---

## 1. System Overview

MonthlyKey is a multi-tenant monthly rental platform deployed on Railway. The system comprises a React 19 SPA served by an Express back-end that exposes tRPC procedures, a Hub-API micro-service for Beds24 channel management, and a Beds24 SDK package for token-based PMS integration. The main database is MySQL 8 on Railway; the Hub-API uses PostgreSQL. All inter-service communication occurs over HTTPS. User authentication is handled via bcrypt-hashed passwords with JWT session tokens stored in httpOnly cookies.

The platform handles **personally identifiable information** (national IDs, phone numbers, emails, addresses), **financial data** (booking amounts, payment records, PayPal transactions), and **lease contracts** (legally binding documents generated server-side). This data classification places MonthlyKey in a high-sensitivity category requiring enterprise-grade security controls.

---

## 2. Trust Boundaries

The following table defines the trust boundaries within the system. Each boundary represents a transition point where data crosses from one trust level to another, requiring validation and access control.

| Boundary ID | From | To | Protocol | Controls Present |
|-------------|------|-----|----------|-----------------|
| TB-1 | Browser (untrusted) | Express/tRPC API | HTTPS | CSP, CORS, rate limiting, Zod validation |
| TB-2 | Express API | MySQL Database | TCP/TLS | Drizzle ORM (parameterized), no raw SQL injection |
| TB-3 | Express API | Local Filesystem (uploads) | Filesystem | Content-type validation, size limits, path sanitization |
| TB-4 | Hub-API | PostgreSQL Database | TCP/TLS | Drizzle ORM, JWT auth, role-based middleware |
| TB-5 | Hub-API | Beds24 API | HTTPS | Token-based auth, token refresh with coalescing |
| TB-6 | Express API | SMTP Server | TCP/TLS | Credentials from env vars, nodemailer |
| TB-7 | Express API | PayPal API | HTTPS | Client ID + Secret from DB settings |
| TB-8 | Express API | OpenAI API | HTTPS | API key from env vars |

---

## 3. Threat Catalog (STRIDE)

### 3.1 Spoofing

| Threat ID | Description | Current State | Risk | Affected Files |
|-----------|-------------|---------------|------|----------------|
| S-01 | **JWT secret fallback allows forged tokens.** If `JWT_SECRET` env var is missing, the server uses `"local-jwt-secret-key-for-development-only-change-in-production"` — a value committed to source code. An attacker who reads the source can forge any session token. | `server/_core/env.ts:3` — fallback string is public in the repo | **CRITICAL** | `server/_core/env.ts`, `server/_core/sdk.ts` |
| S-02 | **OTP pepper fallback is predictable.** `OTP_SECRET_PEPPER` defaults to `"dev-otp-pepper-change-in-production"`. An attacker can brute-force OTP hashes offline if the pepper is known. | `server/_core/env.ts:33` | **HIGH** | `server/_core/env.ts`, `server/otp.ts` |
| S-03 | **Hardcoded admin credentials in source.** The seed script creates user `Hobart` with password `15001500` — a trivially guessable 8-digit numeric password. | `server/seed-admin.ts:24` | **HIGH** | `server/seed-admin.ts` |
| S-04 | **No account lockout after failed logins.** Rate limiting is per-IP (10/5min) but there is no per-account lockout. An attacker using distributed IPs can brute-force passwords indefinitely. | `server/_core/auth.ts` — no `userId`-based counter | **MEDIUM** | `server/_core/auth.ts`, `server/rate-limiter.ts` |

### 3.2 Tampering

| Threat ID | Description | Current State | Risk | Affected Files |
|-----------|-------------|---------------|------|----------------|
| T-01 | **No DB foreign keys — referential integrity not enforced.** An application bug or direct DB access can create orphan records (e.g., bookings referencing deleted properties). Currently 0 orphans exist, but no protection against future corruption. | Production DB: 0 FK constraints, only PRIMARY + UNIQUE indexes | **HIGH** | `drizzle/schema.ts`, all migration files |
| T-02 | **No transaction boundaries on financial operations.** `approveBooking` performs `updateBooking` + `createPayment` + `createNotification` as three independent writes. A crash between writes leaves the system in an inconsistent state (e.g., booking approved but no payment record). | `server/routers.ts:838-870` — zero `db.transaction()` calls in entire codebase | **HIGH** | `server/routers.ts`, `server/db.ts` |
| T-03 | **Custom Markdown-to-HTML renderer without DOMPurify.** `formatMarkdown()` in `PrivacyPolicy.tsx` uses regex-based HTML entity escaping and feeds the result to `dangerouslySetInnerHTML`. While the content source is admin CMS (trusted), a compromised admin account could inject XSS payloads. | `client/src/pages/PrivacyPolicy.tsx:348`, `TermsOfService.tsx:331` | **MEDIUM** | `client/src/pages/PrivacyPolicy.tsx`, `TermsOfService.tsx` |

### 3.3 Repudiation

| Threat ID | Description | Current State | Risk | Affected Files |
|-----------|-------------|---------------|------|----------------|
| R-01 | **Auth events logged to stdout only.** `logAuthEvent()` writes to `console.log()`. Railway captures stdout but logs are ephemeral and not indexed. No structured audit trail exists for login, registration, password changes, or admin actions. | `server/_core/auth.ts:20-23` | **MEDIUM** | `server/_core/auth.ts` |
| R-02 | **No audit log for admin mutations.** Admin operations (approve booking, change settings, delete property) are not logged with actor identity, timestamp, or before/after values. | `server/routers.ts` — admin mutations have no audit middleware | **MEDIUM** | `server/routers.ts`, `server/_core/trpc.ts` |

### 3.4 Information Disclosure

| Threat ID | Description | Current State | Risk | Affected Files |
|-----------|-------------|---------------|------|----------------|
| I-01 | **1-year session tokens without rotation.** A single token leak (XSS, shared device, network interception) grants 365-day access. No refresh token mechanism exists to limit exposure window. | `shared/const.ts:2` — `ONE_YEAR_MS` | **CRITICAL** | `shared/const.ts`, `server/_core/auth.ts` |
| I-02 | **Error stack traces may leak in production.** `console.error` calls include full stack traces. While not directly returned to clients, Railway logs may be accessible to unauthorized personnel. | Multiple files — `catch (error) { console.error(..., error) }` | **LOW** | Various server files |
| I-03 | **PayPal credentials stored in DB settings table.** PayPal `clientId` and `secret` are stored in `platformSettings` alongside non-sensitive settings. Any admin with `manage_settings` permission can read them. | `server/paypal.ts` reads from `db.getSetting()` | **MEDIUM** | `server/paypal.ts`, `server/db.ts` |

### 3.5 Denial of Service

| Threat ID | Description | Current State | Risk | Affected Files |
|-----------|-------------|---------------|------|----------------|
| D-01 | **In-memory rate limiter resets on deploy.** Every Railway deploy restarts the process, clearing all rate limit counters. An attacker can time attacks around deploys or trigger deploys to reset limits. | `server/rate-limiter.ts` — `Map`-based store | **MEDIUM** | `server/rate-limiter.ts` |
| D-02 | **No DB connection pool limits.** `mysql.createPool(DATABASE_URL)` uses default pool settings (no `connectionLimit`, `queueLimit`, or `waitForConnections` config). Under load, the pool can exhaust MySQL connections. Additionally, `push.ts` creates a separate pool, doubling connection usage. | `server/db.ts:32`, `server/push.ts:7` | **MEDIUM** | `server/db.ts`, `server/push.ts` |
| D-03 | **Base64 upload limit is 14MB per request.** While validated, a sustained upload attack from authenticated users can consume significant memory and bandwidth. | `server/security.ts:48` — `MAX_BASE64_SIZE = 14_000_000` | **LOW** | `server/security.ts`, `server/routers.ts` |

### 3.6 Elevation of Privilege

| Threat ID | Description | Current State | Risk | Affected Files |
|-----------|-------------|---------------|------|----------------|
| E-01 | **Password policy allows 6-character passwords.** The minimum password length is 6 characters with no complexity requirements. This contradicts the SRS_ENTERPRISE.md specification of 12+ characters. The hardcoded admin password `15001500` is only 8 characters and purely numeric. | `server/_core/auth.ts` — both register endpoints | **HIGH** | `server/_core/auth.ts` |
| E-02 | **CSP allows `unsafe-inline` and `unsafe-eval`.** While necessary for Google Maps and inline React styles, this weakens XSS protection and could allow injected scripts to execute. | `server/middleware/security-headers.ts:44` | **MEDIUM** | `server/middleware/security-headers.ts` |
| E-03 | **No RBAC on property ownership verification.** Some `protectedProcedure` mutations (e.g., `property.update`, `property.delete`) check `isOwnerOrAdmin` but the check is at the application layer only. A bug in the check logic could allow any authenticated user to modify any property. | `server/routers.ts` — scattered ownership checks | **MEDIUM** | `server/routers.ts` |

---

## 4. Attack Surface Map

```
                    ┌─────────────────────────────────────────┐
                    │           INTERNET (Untrusted)           │
                    └──────────────┬──────────────────────────┘
                                   │ HTTPS
                    ┌──────────────▼──────────────────────────┐
                    │     Railway Reverse Proxy (TLS term.)    │
                    └──────────────┬──────────────────────────┘
                                   │ HTTP
              ┌────────────────────▼────────────────────────────┐
              │              Express Application                 │
              │  ┌────────────┐  ┌──────────┐  ┌─────────────┐ │
              │  │ Auth Routes │  │ tRPC API │  │ Static Files│ │
              │  │ (REST)      │  │ (public/ │  │ (Vite build)│ │
              │  │             │  │  protected│  │             │ │
              │  │             │  │  /admin)  │  │             │ │
              │  └──────┬──────┘  └────┬─────┘  └─────────────┘ │
              │         │              │                         │
              │  ┌──────▼──────────────▼─────┐                  │
              │  │    Middleware Stack         │                  │
              │  │ • Security Headers         │                  │
              │  │ • Compression              │                  │
              │  │ • Rate Limiter (in-memory) │                  │
              │  │ • Zod Input Validation     │                  │
              │  │ • Sanitization             │                  │
              │  └──────────────┬─────────────┘                  │
              └─────────────────┼────────────────────────────────┘
                                │
              ┌─────────────────▼────────────────────────────────┐
              │              MySQL 8 (Railway)                    │
              │  33 tables │ 0 FK constraints │ 3 non-PK indexes │
              └──────────────────────────────────────────────────┘
```

---

## 5. Risk Matrix Summary

The following matrix consolidates all identified threats by likelihood and impact. Items in the **Critical** and **High** quadrants require immediate remediation before any production traffic increase.

| Impact ↓ / Likelihood → | Low | Medium | High |
|--------------------------|-----|--------|------|
| **Critical** | — | I-01 (1yr sessions) | S-01 (JWT fallback) |
| **High** | — | T-01 (no FKs), T-02 (no txns) | S-03 (hardcoded creds), E-01 (weak passwords) |
| **Medium** | I-02 (stack traces), D-03 (upload size) | S-04 (no lockout), D-01 (rate limiter reset), D-02 (pool limits), E-02 (CSP), E-03 (RBAC), R-01 (audit), R-02 (admin audit), T-03 (XSS), I-03 (PayPal in DB), S-02 (OTP pepper) | — |
| **Low** | — | — | — |

---

## 6. Recommended Remediation Priority

The following table maps each threat to a remediation timeline. Detailed implementation specifications are provided in the companion documents (`AUTH_SESSION_SPEC.md`, `DB_INTEGRITY_SPEC.md`, `CACHING_SCALABILITY_PLAN.md`, `CICD_RELEASE_PLAN.md`).

| Priority | Threat IDs | Timeline | Document |
|----------|-----------|----------|----------|
| **P0 — Immediate (24h)** | S-01, S-02, S-03, E-01 | Fail-fast on missing secrets, rotate admin password, enforce 12+ char policy | `AUTH_SESSION_SPEC.md` §2 |
| **P1 — Week 1 (7d)** | I-01, S-04, T-02 | Short-lived access tokens + refresh tokens, account lockout, transaction boundaries | `AUTH_SESSION_SPEC.md` §3, `DB_INTEGRITY_SPEC.md` §3 |
| **P2 — Month 1 (30d)** | T-01, D-01, D-02, R-01, R-02, T-03 | FK constraints, Redis cache/rate-limiter, structured audit logging, DOMPurify | `DB_INTEGRITY_SPEC.md` §2, `CACHING_SCALABILITY_PLAN.md` |
| **P3 — Quarter 1 (90d)** | E-02, E-03, I-02, I-03, D-03 | CSP nonce-based, centralized RBAC middleware, secret vault for PayPal | `CICD_RELEASE_PLAN.md` |

---

## 7. Data Classification

| Category | Examples | Sensitivity | Storage | Encryption at Rest |
|----------|---------|-------------|---------|-------------------|
| **PII** | National ID, phone, email, address, date of birth | High | `users` table | Railway-managed (MySQL TDE) |
| **Credentials** | Password hashes, OTP hashes | Critical | `users`, `otp_codes` tables | bcrypt (cost 12), bcrypt (cost 10 + pepper) |
| **Financial** | Booking amounts, payment records, PayPal order IDs | High | `bookings`, `payments` tables | Railway-managed |
| **Legal** | Lease contracts (HTML/PDF) | High | Local filesystem (`/app/uploads`) | None (volume mount) |
| **Session** | JWT tokens | Critical | httpOnly cookies | Signed (HS256) |
| **Integration** | Beds24 refresh token, PayPal client secret, SMTP password | Critical | Environment variables, `platformSettings` | Railway env encryption |
| **Content** | Property listings, CMS pages, AI conversations | Medium | Multiple tables | Railway-managed |

---

## 8. Assumptions and Exclusions

This threat model assumes that Railway's infrastructure provides TLS termination, network isolation, and encrypted storage at rest. It excludes threats related to Railway's own infrastructure security, DNS hijacking, and physical access to data centers. The Beds24 integration is treated as an external dependency whose API security is managed by Beds24. The Hub-API micro-service is assessed separately where its architecture differs from the main application (e.g., PostgreSQL with proper FK/indexes vs. MySQL without).

**No Beds24 changes.** This document does not recommend any modifications to the Beds24 SDK, token management, or API integration patterns.

**No Mansun dependency added.** All recommended solutions use standard Node.js, MySQL, PostgreSQL, and Redis infrastructure without any proprietary vendor lock-in.
