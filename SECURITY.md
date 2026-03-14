# Security Policy — Monthly Key

## System Owner Account (ROOT_ADMIN)

| Field | Value |
|---|---|
| **Username** | Hobart |
| **Email** | hobarti@protonmail.com |
| **Phone** | +966504466528 |
| **Role** | isOwner = true (highest privilege level) |

## Protection Rules

1. The `isOwner` account **cannot be deleted**, suspended, or downgraded.
2. The `isOwner` flag is **not grantable via API** — it can only be set via the database seed endpoint (`/api/auth/seed-owner`) or direct DB access.
3. Every attempt to modify the owner account is blocked by the `protectOwner` middleware and logged in the security audit trail.

## Seed Owner Endpoint

```
POST /api/auth/seed-owner
```

This endpoint creates the system owner account if it does not already exist. If the user `Hobart` already exists but is not marked as owner, it upgrades the existing account. This endpoint is idempotent and safe to call multiple times.

## For Developers

- Do not create endpoints that bypass the `protectOwner` middleware.
- Test security scenarios after any auth-related changes.
- The break-glass admin system (via `BREAKGLASS_ADMIN_EMAILS` and `BREAKGLASS_ADMIN_USER_IDS` env vars) provides emergency bypass for verification/KYC gates only — it does not override the owner protection.

## Contact

For security issues, contact: hobarti@protonmail.com | +966504466528
