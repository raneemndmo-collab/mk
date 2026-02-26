# MonthlyKey — Authentication & Session Management Specification

**Version:** 2.0  
**Date:** 2026-02-26  
**Classification:** Internal — Engineering  
**Compliance note:** No Beds24 changes. No Mansun dependency added.

---

## 1. Executive Summary

This specification defines the target-state authentication and session management architecture for MonthlyKey. The current implementation uses single long-lived JWT tokens (365-day expiry) with a 6-character minimum password policy. This document specifies the migration to a dual-token architecture (15-minute access tokens with 7-day refresh tokens), a 12-character password policy with complexity requirements, and an account lockout mechanism. All changes are confined to the main application; the Hub-API and Beds24 SDK remain untouched.

---

## 2. Critical Hotfix: JWT Secret Fail-Fast (P0 — 24 Hours)

### 2.1 Current State

The file `server/_core/env.ts` contains a fallback value for the JWT secret:

```typescript
// CURRENT (VULNERABLE)
cookieSecret: process.env.JWT_SECRET ?? "local-jwt-secret-key-for-development-only-change-in-production"
```

If the `JWT_SECRET` environment variable is missing in production, the server starts with a publicly known secret, allowing any attacker who reads the source code to forge session tokens for any user.

### 2.2 Required Change

The server must refuse to start in production if `JWT_SECRET` is not set or is shorter than 64 characters.

**File:** `server/_core/env.ts`

```typescript
// FIXED
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;
  
  if (isProduction) {
    if (!secret) {
      console.error("FATAL: JWT_SECRET environment variable is required in production.");
      process.exit(1);
    }
    if (secret.length < 64) {
      console.error("FATAL: JWT_SECRET must be at least 64 characters in production.");
      process.exit(1);
    }
    return secret;
  }
  
  // Development fallback — acceptable only in local dev
  return secret ?? "local-jwt-secret-key-for-development-only-change-in-production";
}

export const ENV = {
  cookieSecret: getJwtSecret(),
  // ... rest unchanged
};
```

**Verification command:**

```bash
# Generate a production-grade secret
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# Set it in Railway
railway variables set JWT_SECRET=<generated_value>
```

### 2.3 OTP Pepper Fail-Fast

The same pattern applies to `OTP_SECRET_PEPPER` in the same file. Apply identical fail-fast logic.

### 2.4 Acceptance Criteria

| Test | Expected Result |
|------|----------------|
| Start server without `JWT_SECRET` in production | Process exits with code 1 and `FATAL` message |
| Start server with `JWT_SECRET` shorter than 64 chars in production | Process exits with code 1 |
| Start server with valid `JWT_SECRET` (≥64 chars) in production | Server starts normally |
| Start server without `JWT_SECRET` in development | Server starts with fallback (warning logged) |

---

## 3. Password Policy (P0 — 24 Hours)

### 3.1 Current State

Both registration endpoints in `server/_core/auth.ts` enforce a 6-character minimum with no complexity requirements:

```typescript
// CURRENT
if (password.length < 6) {
  return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
}
```

The SRS_ENTERPRISE.md document specifies 12+ characters — a direct contradiction with the implementation.

### 3.2 Target Policy

| Requirement | Value | Rationale |
|-------------|-------|-----------|
| Minimum length | 12 characters | NIST SP 800-63B recommends 8+ for memorized secrets; 12 provides margin [1] |
| Maximum length | 128 characters | Prevents bcrypt truncation (72 bytes) abuse while allowing passphrases |
| Complexity | At least 1 uppercase + 1 lowercase + 1 digit + 1 special character | Defense-in-depth against dictionary attacks |
| Breach check | Optional — HaveIBeenPwned API (k-anonymity model) | Prevents use of known compromised passwords |

### 3.3 Implementation

**File:** `server/_core/auth.ts` (both `registerLocal` and `registerWithOtp` handlers)

```typescript
function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 12) {
    return { valid: false, message: "كلمة المرور يجب أن تكون 12 حرفاً على الأقل" };
  }
  if (password.length > 128) {
    return { valid: false, message: "كلمة المرور يجب ألا تتجاوز 128 حرفاً" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل" };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل" };
  }
  return { valid: true, message: "" };
}
```

### 3.4 Migration Plan for Existing Users

Existing users with weak passwords are not forced to change immediately. Instead, the system logs a warning on login if the password does not meet the new policy and sets a flag `passwordPolicyCompliant: false` on the user record. A future sprint can implement a forced password change flow.

### 3.5 Admin Seed Password

The hardcoded password `15001500` in `server/seed-admin.ts` must be replaced. The seed script should generate a random password on first run and print it to stdout (one-time), or read from an environment variable `ADMIN_INITIAL_PASSWORD`.

**File:** `server/seed-admin.ts`

```typescript
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
if (!adminPassword) {
  const generated = crypto.randomBytes(16).toString('base64url');
  console.log(`[Seed] Generated admin password: ${generated}`);
  console.log("[Seed] Set ADMIN_INITIAL_PASSWORD env var to use a specific password.");
  // Use generated password
}
```

---

## 4. Dual-Token Architecture (P1 — 7 Days)

### 4.1 Current State

The system issues a single JWT token with a 365-day expiry stored in an httpOnly cookie. There is no refresh mechanism, no token rotation, and no way to revoke a compromised token short of changing the JWT secret (which invalidates all sessions).

### 4.2 Target Architecture

```
┌──────────┐     Login      ┌──────────────┐
│  Client  │ ──────────────→│   Auth API   │
│ (Browser)│                │              │
│          │←───────────────│  Returns:    │
│          │  Set-Cookie:   │  • access_token (15min, httpOnly)
│          │  access_token  │  • refresh_token (7d, httpOnly, /api/auth/refresh path)
│          │  refresh_token │              │
└──────────┘                └──────────────┘
     │                            │
     │  API Request               │
     │  Cookie: access_token      │
     │ ──────────────────────────→│
     │                            │ Verify JWT
     │←───────────────────────────│ (15min expiry)
     │  200 OK                    │
     │                            │
     │  Access token expired      │
     │  POST /api/auth/refresh    │
     │  Cookie: refresh_token     │
     │ ──────────────────────────→│
     │                            │ Verify refresh token
     │←───────────────────────────│ Issue new access + refresh
     │  New cookies set           │ (rotation: old refresh invalidated)
```

### 4.3 Token Specifications

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| **Lifetime** | 15 minutes | 7 days |
| **Storage** | httpOnly cookie, `SameSite=Lax`, `Secure=true` | httpOnly cookie, `SameSite=Strict`, `Secure=true`, `Path=/api/auth/refresh` |
| **Payload** | `{ userId, role, iat, exp }` | `{ userId, tokenFamily, generation, iat, exp }` |
| **Rotation** | New token on every refresh | New token on every refresh (old one invalidated) |
| **Revocation** | Not needed (short-lived) | Store `tokenFamily` in DB; revoke family on reuse detection |

### 4.4 Refresh Token Rotation with Reuse Detection

Each refresh token belongs to a `tokenFamily` (UUID generated at login). When a refresh token is used, the server issues a new refresh token with an incremented `generation` counter and stores the latest generation in the database. If a refresh token with an older generation is presented, it indicates token theft — the entire family is revoked, forcing re-authentication.

**New DB table:** `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  tokenFamily VARCHAR(36) NOT NULL,
  generation INT NOT NULL DEFAULT 0,
  expiresAt DATETIME NOT NULL,
  revokedAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_family (tokenFamily),
  INDEX idx_refresh_userId (userId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.5 Client-Side Integration

The React client must handle 401 responses by attempting a silent refresh before redirecting to login. This is implemented as an interceptor in the tRPC client link chain.

```typescript
// client/src/lib/trpc.ts — conceptual
const refreshLink = () => {
  let refreshing: Promise<void> | null = null;
  return (opts) => {
    return observable((observer) => {
      opts.next(opts.op).subscribe({
        error(err) {
          if (err.data?.code === "UNAUTHORIZED" && !opts.op.context.retried) {
            if (!refreshing) {
              refreshing = fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
                .then(r => { if (!r.ok) throw r; })
                .finally(() => { refreshing = null; });
            }
            refreshing
              .then(() => {
                opts.op.context.retried = true;
                opts.next(opts.op).subscribe(observer);
              })
              .catch(() => {
                window.location.href = "/login";
              });
          } else {
            observer.error(err);
          }
        },
        next: observer.next.bind(observer),
        complete: observer.complete.bind(observer),
      });
    });
  };
};
```

### 4.6 Acceptance Criteria

| Test | Expected Result |
|------|----------------|
| Login returns two httpOnly cookies | `access_token` (15min) + `refresh_token` (7d) |
| API call with valid access token | 200 OK |
| API call with expired access token | 401 Unauthorized |
| POST `/api/auth/refresh` with valid refresh token | New access + refresh tokens, 200 OK |
| POST `/api/auth/refresh` with expired refresh token | 401, redirect to login |
| POST `/api/auth/refresh` with reused (old generation) refresh token | 401, entire token family revoked |
| Logout | Both cookies cleared, refresh token family revoked in DB |

---

## 5. Account Lockout (P1 — 7 Days)

### 5.1 Design

The system tracks failed login attempts per `userId` (not per IP, which is already handled by the rate limiter). After 5 consecutive failed attempts, the account is locked for 30 minutes. The lockout counter resets on successful login.

**New columns on `users` table:**

```sql
ALTER TABLE users
  ADD COLUMN failedLoginAttempts INT NOT NULL DEFAULT 0,
  ADD COLUMN lockedUntil DATETIME NULL;
```

### 5.2 Logic

```typescript
// In login handler (server/_core/auth.ts)
async function checkAndUpdateLoginAttempts(user: User, success: boolean): Promise<boolean> {
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    throw new Error(`الحساب مقفل. حاول مرة أخرى بعد ${remainingMinutes} دقيقة`);
  }
  
  if (success) {
    await db.updateUser(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    return true;
  }
  
  const attempts = (user.failedLoginAttempts || 0) + 1;
  const updates: Partial<User> = { failedLoginAttempts: attempts };
  
  if (attempts >= 5) {
    updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    updates.failedLoginAttempts = 0; // Reset counter for next lockout cycle
  }
  
  await db.updateUser(user.id, updates);
  return false;
}
```

### 5.3 Acceptance Criteria

| Test | Expected Result |
|------|----------------|
| 4 failed login attempts | Error message with remaining attempts count |
| 5th failed login attempt | Account locked, error shows "locked for 30 minutes" |
| Login attempt during lockout | Rejected with remaining lockout time |
| Login after lockout expires | Succeeds normally, counter reset |
| Successful login after 3 failed attempts | Counter resets to 0 |

---

## 6. Session Revocation (P2 — 30 Days)

### 6.1 Active Sessions Management

Users should be able to view and revoke their active sessions. This requires storing session metadata (device, IP, last active) alongside refresh token families.

**Extended `refresh_tokens` table:**

```sql
ALTER TABLE refresh_tokens
  ADD COLUMN userAgent VARCHAR(500) NULL,
  ADD COLUMN ipAddress VARCHAR(45) NULL,
  ADD COLUMN lastUsedAt DATETIME NULL;
```

### 6.2 Admin Session Revocation

Administrators with `manage_users` permission can revoke all sessions for any user by invalidating all their refresh token families. This is critical for incident response (e.g., compromised account).

---

## 7. Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `server/_core/env.ts` | **Modify** | Add fail-fast for `JWT_SECRET` and `OTP_SECRET_PEPPER` in production |
| `server/_core/auth.ts` | **Modify** | Password validation (12+ chars, complexity), dual-token issuance, account lockout |
| `server/seed-admin.ts` | **Modify** | Replace hardcoded password with env var or generated password |
| `shared/const.ts` | **Modify** | Add `ACCESS_TOKEN_TTL = 15 * 60 * 1000` and `REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000` |
| `drizzle/schema.ts` | **Modify** | Add `refresh_tokens` table, add `failedLoginAttempts` and `lockedUntil` to `users` |
| `server/db.ts` | **Modify** | Add CRUD functions for refresh tokens |
| `client/src/lib/trpc.ts` | **Modify** | Add refresh token interceptor link |

**No Beds24 changes.** The Beds24 SDK and Hub-API authentication remain unchanged.  
**No Mansun dependency added.** All implementations use standard Node.js `crypto`, `jsonwebtoken`, and `bcryptjs`.

---

## References

[1]: https://pages.nist.gov/800-63-3/sp800-63b.html "NIST SP 800-63B — Digital Identity Guidelines: Authentication and Lifecycle Management"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html "OWASP Session Management Cheat Sheet"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html "OWASP Authentication Cheat Sheet"
