# Security Remediation — Applied Fixes (2026-03-08)

All fixes from the API Security Audit have been applied. This document tracks each fix, the file(s) changed, and the specific vulnerability addressed.

---

## P0 — Critical (Immediate)

### Fix 1: `passwordHash` Exposure Stripped
**Files:** `server/routers/auth.router.ts`
**Vulnerability:** `auth.me` and `auth.getFullProfile` returned the full user object including `passwordHash` (bcrypt hash) to the browser.
**Fix:** Added `sanitizeUser()` helper that strips `passwordHash` from all user objects before returning to the client. Applied to `auth.me`, `auth.getFullProfile`, and `auth.updateProfile` responses.

### Fix 2: Debug Endpoint Blocked in Production
**Files:** `server/_core/index.ts`
**Vulnerability:** `/api/debug-proof` was accessible without authentication in production, exposing bookings, ledger entries, and payment config.
**Fix:** Wrapped the endpoint in `NODE_ENV !== 'production'` guard. Also blocked `/api/backfill-*` endpoints in production.

### Fix 3: Tabby & Tamara Webhook HMAC Verification
**Files:** `server/payment-webhooks.ts`
**Vulnerability:** Tabby and Tamara webhook handlers had no signature verification — attackers could forge payment confirmations to mark invoices as PAID.
**Fix:** Complete rewrite of `payment-webhooks.ts`:
- **Moyasar:** Mandatory HMAC-SHA256 verification (rejects if `MOYASAR_WEBHOOK_SECRET` is not set)
- **Tabby:** HMAC-SHA256 verification using `TABBY_WEBHOOK_SECRET`
- **Tamara:** HMAC-SHA256 verification using `TAMARA_WEBHOOK_SECRET`
- All three providers now reject requests with missing or invalid signatures with HTTP 401

### Fix 4: Image Proxy SSRF Protection
**Files:** `server/_core/index.ts`
**Vulnerability:** `/api/img-proxy` fetched any HTTPS URL without restriction, allowing SSRF attacks against internal services.
**Fix:** Added domain allowlist (`ALLOWED_IMG_PROXY_DOMAINS`) restricting the proxy to known CDN/storage domains only. Returns 403 for unlisted domains.

---

## P1 — High Severity

### Fix 5: OG Cache Invalidation Auth + Rate Limit
**Files:** `server/_core/index.ts`
**Vulnerability:** `/api/og/invalidate` was a public endpoint allowing anyone to flush the OG image cache (DoS vector).
**Fix:** Added admin authentication check and IP-based rate limiting (10 requests per 5 minutes).

### Fix 6: WhatsApp Webhook Signature Verification
**Files:** `server/whatsapp-cloud.ts`
**Vulnerability:** `verifyWebhookSignature()` function existed but was never called in the webhook handler.
**Fix:** Added HMAC-SHA256 signature verification to the POST webhook handler. Logs warnings and rejects requests with invalid signatures when `WHATSAPP_APP_SECRET` is configured.

### Fix 8: Storage Path Traversal Protection
**Files:** `server/storage.ts`
**Vulnerability:** `normalizeKey()` did not prevent `../` sequences, allowing potential path traversal attacks.
**Fix:** Added explicit `../` and `..\\` detection with error throwing. Also blocks absolute paths and null bytes.

### Fix 9: AI Conversation IDOR Prevention
**Files:** `server/routers/ai.router.ts`
**Vulnerability:** `deleteConversation` and `messages` endpoints accepted any conversation ID without verifying ownership — any authenticated user could delete or read any other user's AI conversations.
**Fix:** Added ownership verification: queries the user's conversations first and checks if the target conversation belongs to them before proceeding.

### Fix 10: Contact Form Rate Limiting
**Files:** `server/routers/notification.router.ts`
**Vulnerability:** Public `contact.submit` endpoint had no rate limiting, allowing spam floods.
**Fix:** Added IP-based rate limiting (5 submissions per hour per IP) and input sanitization via `sanitizeObject()`.

### Fix 11: Profile Update Input Sanitization
**Files:** `server/routers/auth.router.ts`
**Vulnerability:** `updateProfile` mutation did not sanitize input fields using the existing `sanitizeObject()` function.
**Fix:** Applied `sanitizeObject()` to all profile update inputs before passing to the database layer.

### Fix 12: Renewal Eligibility Authorization
**Files:** `server/finance-routers.ts`
**Vulnerability:** `renewals.checkEligibility` accepted any booking ID from any authenticated user, leaking booking data.
**Fix:** Added booking participant check — only the tenant, landlord, or admin can check renewal eligibility for a booking.

---

## P2 — Medium Severity

### Fix 13: Role Switching Restrictions
**Files:** `server/routers/auth.router.ts`
**Vulnerability:** Self-service `switchRole` had no restrictions — admin users could accidentally downgrade themselves.
**Fix:** Blocked admin users from using self-service role switching (must use admin panel). Added audit logging for all role changes.

### Fix 14: Manager Edit Token Expiry
**Files:** `server/db.ts`, `drizzle/schema.ts`
**Vulnerability:** Manager edit tokens had no expiry — once generated, they were valid forever.
**Fix:** Added `editTokenExpiresAt` column to `property_managers` table. Tokens now expire after 24 hours. `getManagerByToken()` checks expiry and auto-clears expired tokens.

### Fix 15: CMS SQL Parameterization
**Files:** `server/routers/cms.router.ts`
**Vulnerability:** `LIMIT` and `OFFSET` values were interpolated directly into SQL strings in the media list query.
**Fix:** Changed to parameterized query using `LIMIT ? OFFSET ?` with bound values.

### Fix 17: Encryption Key Startup Warning
**Files:** `server/encryption.ts`
**Vulnerability:** Missing `SETTINGS_ENCRYPTION_KEY` silently fell back to plaintext storage with no warning.
**Fix:** Added one-time startup warning when the key is missing or invalid, including a command to generate one.

### Fix 18: Admin Role Promotion Restriction
**Files:** `server/routers/admin.router.ts`
**Vulnerability:** Any admin with `MANAGE_USERS` permission could promote users to admin role.
**Fix:** Only root admin can now promote users to admin role. Non-root admins get a 403 error.

### Fix 19: User/Email/Phone Enumeration Mitigation
**Files:** `server/_core/auth.ts`
**Vulnerability:** Registration endpoints returned specific error messages ("User ID already exists", "Phone number already registered", "Email already registered") that allowed attackers to enumerate valid accounts.
**Fix:** All duplicate-check errors now return a generic "Registration failed. Please check your details and try again." message. Specific reasons are logged server-side for debugging.

---

## P3 — Low Severity / Hardening

### CORS Configuration
**Files:** `server/middleware/security-headers.ts`
**Vulnerability:** No CORS configuration — browser same-origin policy was the only protection.
**Fix:** Added explicit CORS with origin allowlist (`monthlykey.com`, Railway previews, localhost in dev). Handles preflight OPTIONS requests.

### Body Parser Limit Reduction
**Files:** `server/_core/index.ts`
**Vulnerability:** Body parser limit was 50MB, enabling large payload DoS attacks.
**Fix:** Reduced to 10MB (sufficient for base64 image uploads).

### SVG Upload Removal
**Files:** `server/security.ts`
**Vulnerability:** SVG files were in the allowed upload types. SVG can contain embedded JavaScript (XSS vector).
**Fix:** Removed `image/svg+xml` from `ALLOWED_IMAGE_TYPES` and `svg` from the extension-to-MIME mapping.

### CSP Tightening
**Files:** `server/middleware/security-headers.ts`
**Vulnerability:** CSP included `unsafe-eval` in script-src.
**Fix:** Removed `unsafe-eval` from CSP script-src directive. Added `upgrade-insecure-requests` in production.

---

## Environment Variables Required

The following new environment variables should be set in production:

| Variable | Purpose | Required |
|----------|---------|----------|
| `TABBY_WEBHOOK_SECRET` | HMAC secret for Tabby payment webhooks | Yes (if using Tabby) |
| `TAMARA_WEBHOOK_SECRET` | HMAC secret for Tamara payment webhooks | Yes (if using Tamara) |
| `MOYASAR_WEBHOOK_SECRET` | HMAC secret for Moyasar payment webhooks | Yes (mandatory) |
| `WHATSAPP_APP_SECRET` | Meta App Secret for WhatsApp webhook verification | Yes (if using WhatsApp) |
| `SETTINGS_ENCRYPTION_KEY` | 64 hex chars (32 bytes) for AES-256-GCM encryption | Strongly recommended |

Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Summary

| Priority | Fixes Applied | Status |
|----------|--------------|--------|
| P0 (Critical) | 4 | Done |
| P1 (High) | 7 | Done |
| P2 (Medium) | 6 | Done |
| P3 (Low) | 4 | Done |
| **Total** | **21** | **All Applied** |
