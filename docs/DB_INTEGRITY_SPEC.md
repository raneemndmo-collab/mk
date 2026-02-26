# MonthlyKey — Database Integrity Specification

**Version:** 2.0  
**Date:** 2026-02-26  
**Classification:** Internal — Engineering  
**Compliance note:** No Beds24 changes. No Mansun dependency added.

---

## 1. Executive Summary

The MonthlyKey production MySQL database contains 33 tables with **zero foreign key constraints** and only **3 non-primary-key indexes** (on `otp_codes` and `platformSettings`). While no orphan records currently exist (verified 2026-02-26), the absence of referential integrity constraints means that any application bug, manual SQL operation, or concurrent race condition can silently corrupt data relationships. This specification defines the migration plan for adding foreign keys, indexes, and transaction boundaries, along with ongoing orphan detection procedures.

---

## 2. Foreign Key Constraints (P1 — 7 Days)

### 2.1 Current State

The production database has zero foreign key constraints. All referential integrity is enforced at the application layer through Drizzle ORM's `.references()` declarations in `drizzle/schema.ts`, but these are **documentation-only** — Drizzle does not enforce FK constraints at the database level unless explicitly migrated.

### 2.2 Required Foreign Keys

The following table lists all required foreign key constraints, ordered by criticality. Each constraint includes the `ON DELETE` behavior that preserves data integrity while preventing cascade-deletion of financial records.

| FK ID | Table | Column | References | ON DELETE | Rationale |
|-------|-------|--------|------------|-----------|-----------|
| FK-01 | `bookings` | `tenantId` | `users.id` | `RESTRICT` | Bookings must not be orphaned; deleting a user with active bookings should fail |
| FK-02 | `bookings` | `landlordId` | `users.id` | `RESTRICT` | Same as above — landlord deletion blocked if bookings exist |
| FK-03 | `bookings` | `propertyId` | `properties.id` | `RESTRICT` | Property deletion blocked if bookings exist |
| FK-04 | `payments` | `bookingId` | `bookings.id` | `RESTRICT` | Payment records must always reference a valid booking |
| FK-05 | `properties` | `landlordId` | `users.id` | `RESTRICT` | Property must reference a valid landlord |
| FK-06 | `favorites` | `userId` | `users.id` | `CASCADE` | Deleting a user removes their favorites |
| FK-07 | `favorites` | `propertyId` | `properties.id` | `CASCADE` | Deleting a property removes associated favorites |
| FK-08 | `reviews` | `userId` | `users.id` | `SET NULL` | Preserve review content even if reviewer account is deleted |
| FK-09 | `reviews` | `propertyId` | `properties.id` | `CASCADE` | Deleting a property removes its reviews |
| FK-10 | `messages` | `conversationId` | `conversations.id` | `CASCADE` | Deleting a conversation removes its messages |
| FK-11 | `messages` | `senderId` | `users.id` | `SET NULL` | Preserve message content even if sender is deleted |
| FK-12 | `notifications` | `userId` | `users.id` | `CASCADE` | Deleting a user removes their notifications |
| FK-13 | `maintenanceRequests` | `tenantId` | `users.id` | `RESTRICT` | Maintenance records must reference valid tenant |
| FK-14 | `maintenanceRequests` | `propertyId` | `properties.id` | `RESTRICT` | Maintenance records must reference valid property |
| FK-15 | `adminPermissions` | `userId` | `users.id` | `CASCADE` | Deleting admin user removes their permissions |
| FK-16 | `savedSearches` | `userId` | `users.id` | `CASCADE` | Deleting a user removes their saved searches |
| FK-17 | `inspectionRequests` | `propertyId` | `properties.id` | `RESTRICT` | Inspection must reference valid property |
| FK-18 | `propertyAvailability` | `propertyId` | `properties.id` | `CASCADE` | Deleting property removes availability records |
| FK-19 | `propertyManagerAssignments` | `managerId` | `propertyManagers.id` | `CASCADE` | Deleting manager removes assignments |
| FK-20 | `propertyManagerAssignments` | `propertyId` | `properties.id` | `CASCADE` | Deleting property removes manager assignments |

### 2.3 Migration Script

The migration must be executed in a maintenance window because adding FK constraints on existing tables requires a table lock. The migration should be split into two phases: first verify no orphans exist (blocking), then add constraints.

**File:** `drizzle/migrations/XXXX_add_foreign_keys.sql`

```sql
-- Phase 1: Pre-flight orphan check (run manually, abort if any count > 0)
-- See Section 4 for the full orphan detection query.

-- Phase 2: Add foreign keys (run in migration)
ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_tenant FOREIGN KEY (tenantId) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_bookings_landlord FOREIGN KEY (landlordId) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_bookings_property FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE RESTRICT;

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_booking FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE RESTRICT;

ALTER TABLE properties
  ADD CONSTRAINT fk_properties_landlord FOREIGN KEY (landlordId) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE favorites
  ADD CONSTRAINT fk_favorites_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_favorites_property FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE reviews
  ADD CONSTRAINT fk_reviews_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_reviews_property FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_conversation FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_messages_sender FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE maintenanceRequests
  ADD CONSTRAINT fk_maintenance_tenant FOREIGN KEY (tenantId) REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_maintenance_property FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE RESTRICT;

ALTER TABLE adminPermissions
  ADD CONSTRAINT fk_admin_perms_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE savedSearches
  ADD CONSTRAINT fk_saved_searches_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE inspectionRequests
  ADD CONSTRAINT fk_inspection_property FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE RESTRICT;

ALTER TABLE propertyAvailability
  ADD CONSTRAINT fk_availability_property FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE propertyManagerAssignments
  ADD CONSTRAINT fk_pma_manager FOREIGN KEY (managerId) REFERENCES propertyManagers(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_pma_property FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE;
```

### 2.4 Rollback Plan

If FK constraints cause application errors (e.g., a delete operation that now fails due to `RESTRICT`), the constraints can be dropped individually without data loss:

```sql
ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_tenant;
-- Repeat for each constraint as needed
```

---

## 3. Transaction Boundaries (P1 — 7 Days)

### 3.1 Current State

The entire codebase contains **zero** uses of `db.transaction()`. Multi-step write operations are performed as independent queries. The following operations are at risk of partial completion:

| Operation | File:Line | Steps | Risk |
|-----------|-----------|-------|------|
| **Approve Booking** | `routers.ts:838-870` | `updateBooking(approved)` → `createPayment` → `createNotification` | Booking approved but no payment record created |
| **Confirm Payment** | `routers.ts:875-920` | `updateBooking(confirmed)` → loop `updatePayment` → `createNotification` | Booking confirmed but payments not updated |
| **Reject Booking** | `routers.ts:925-945` | `updateBooking(rejected)` → `createNotification` | Minor — notification is non-critical |
| **Create Booking** | `routers.ts:329-397` | `createBooking` → `createNotification` → `sendEmail` | Booking created but no notification |
| **Cancel Booking** | `routers.ts:400-450` | `updateBooking(cancelled)` → `createNotification` | Minor — notification is non-critical |

### 3.2 Implementation

Drizzle ORM for MySQL supports transactions via the pool's `transaction` method. The implementation wraps all multi-step financial operations in a transaction.

**File:** `server/db.ts` — add transaction helper

```typescript
import { MySqlTransaction } from "drizzle-orm/mysql-core";

export async function withTransaction<T>(
  fn: (tx: MySqlTransaction<any, any, any, any>) => Promise<T>
): Promise<T> {
  return getDb().transaction(fn);
}
```

**File:** `server/routers.ts` — wrap `approveBooking`

```typescript
// BEFORE (vulnerable)
await db.updateBooking(bookingId, { status: "approved", ... });
await db.createPayment({ bookingId, amount, ... });
await db.createNotification({ userId: tenantId, ... });

// AFTER (safe)
await db.withTransaction(async (tx) => {
  await tx.update(bookings).set({ status: "approved", ... }).where(eq(bookings.id, bookingId));
  await tx.insert(payments).values({ bookingId, amount, ... });
  await tx.insert(notifications).values({ userId: tenantId, ... });
});
```

### 3.3 Non-Transactional Operations

Email sending and push notifications must remain **outside** the transaction boundary. These are side effects that should not cause a transaction rollback if they fail. The pattern is:

```typescript
// Transaction for DB writes
const result = await db.withTransaction(async (tx) => {
  // ... DB operations
  return { bookingId, tenantId };
});

// Side effects after commit (fire-and-forget)
sendBookingConfirmation(result.bookingId).catch(err => console.error("Email failed:", err));
sendPushToUser(result.tenantId, { ... }).catch(err => console.error("Push failed:", err));
```

### 3.4 Acceptance Criteria

| Test | Expected Result |
|------|----------------|
| Approve booking with simulated DB failure after `updateBooking` | Entire operation rolls back, booking remains in `pending` state |
| Approve booking successfully | All three writes (booking, payment, notification) committed atomically |
| Email failure after booking approval | Transaction committed, email error logged, no rollback |

---

## 4. Orphan Detection (Ongoing)

### 4.1 Detection Query

The following query should be run weekly (or before every deployment) to detect orphan records. All counts must be zero.

```sql
SELECT 'bookings→users(tenant)' AS relation, COUNT(*) AS orphans 
  FROM bookings b LEFT JOIN users u ON b.tenantId=u.id WHERE u.id IS NULL
UNION ALL
SELECT 'bookings→users(landlord)', COUNT(*) 
  FROM bookings b LEFT JOIN users u ON b.landlordId=u.id WHERE u.id IS NULL
UNION ALL
SELECT 'bookings→properties', COUNT(*) 
  FROM bookings b LEFT JOIN properties p ON b.propertyId=p.id WHERE p.id IS NULL
UNION ALL
SELECT 'payments→bookings', COUNT(*) 
  FROM payments p LEFT JOIN bookings b ON p.bookingId=b.id WHERE b.id IS NULL
UNION ALL
SELECT 'properties→users(landlord)', COUNT(*) 
  FROM properties p LEFT JOIN users u ON p.landlordId=u.id WHERE u.id IS NULL
UNION ALL
SELECT 'favorites→users', COUNT(*) 
  FROM favorites f LEFT JOIN users u ON f.userId=u.id WHERE u.id IS NULL
UNION ALL
SELECT 'favorites→properties', COUNT(*) 
  FROM favorites f LEFT JOIN properties p ON f.propertyId=p.id WHERE p.id IS NULL
UNION ALL
SELECT 'reviews→properties', COUNT(*) 
  FROM reviews r LEFT JOIN properties p ON r.propertyId=p.id WHERE p.id IS NULL
UNION ALL
SELECT 'messages→conversations', COUNT(*) 
  FROM messages m LEFT JOIN conversations c ON m.conversationId=c.id WHERE c.id IS NULL
UNION ALL
SELECT 'notifications→users', COUNT(*) 
  FROM notifications n LEFT JOIN users u ON n.userId=u.id WHERE u.id IS NULL
UNION ALL
SELECT 'maintenanceRequests→users', COUNT(*) 
  FROM maintenanceRequests m LEFT JOIN users u ON m.tenantId=u.id WHERE u.id IS NULL
UNION ALL
SELECT 'maintenanceRequests→properties', COUNT(*) 
  FROM maintenanceRequests m LEFT JOIN properties p ON m.propertyId=p.id WHERE p.id IS NULL
UNION ALL
SELECT 'adminPermissions→users', COUNT(*) 
  FROM adminPermissions a LEFT JOIN users u ON a.userId=u.id WHERE u.id IS NULL;
```

### 4.2 Latest Scan Results (2026-02-26)

| Relation | Orphan Count |
|----------|-------------|
| bookings → users (tenant) | 0 |
| bookings → users (landlord) | 0 |
| bookings → properties | 0 |
| payments → bookings | 0 |
| properties → users (landlord) | 0 |
| favorites → users | 0 |
| favorites → properties | 0 |
| reviews → properties | 0 |
| messages → conversations | 0 |

All relations are clean. This is the baseline before FK constraints are added.

---

## 5. Index Plan (P2 — 30 Days)

### 5.1 Current Indexes

The production database has only the following non-primary-key indexes:

| Table | Index Name | Column(s) | Type |
|-------|-----------|-----------|------|
| `users` | `users_openId_unique` | `openId` | UNIQUE |
| `users` | `users_userId_unique` | `userId` | UNIQUE |
| `platformSettings` | `platformSettings_settingKey_unique` | `settingKey` | UNIQUE |
| `otp_codes` | `idx_otp_destination_purpose` | `destination, purpose` | NON-UNIQUE |
| `otp_codes` | `idx_otp_expires` | `expiresAt` | NON-UNIQUE |
| `propertyManagers` | `propertyManagers_editToken_unique` | `editToken` | UNIQUE |

### 5.2 Required Indexes

Every foreign key column and every column used in `WHERE`, `ORDER BY`, or `JOIN` clauses should have an index. The following indexes are missing and should be added in order of query frequency.

| Priority | Table | Column(s) | Index Name | Justification |
|----------|-------|-----------|------------|---------------|
| **P1** | `bookings` | `tenantId` | `idx_bookings_tenant` | Used in `myBookings` query (every tenant page load) |
| **P1** | `bookings` | `landlordId` | `idx_bookings_landlord` | Used in `landlordBookings` query |
| **P1** | `bookings` | `propertyId` | `idx_bookings_property` | Used in availability checks |
| **P1** | `bookings` | `status` | `idx_bookings_status` | Used in admin dashboard filters |
| **P1** | `payments` | `bookingId` | `idx_payments_booking` | Used in payment lookups per booking |
| **P1** | `properties` | `landlordId` | `idx_properties_landlord` | Used in `getByLandlord` query |
| **P1** | `properties` | `city` | `idx_properties_city` | Used in search filters |
| **P1** | `properties` | `status` | `idx_properties_status` | Used in search (active only) |
| **P2** | `favorites` | `userId` | `idx_favorites_user` | Used in favorites list |
| **P2** | `favorites` | `propertyId` | `idx_favorites_property` | Used in favorite check |
| **P2** | `reviews` | `propertyId` | `idx_reviews_property` | Used in property detail page |
| **P2** | `messages` | `conversationId` | `idx_messages_conversation` | Used in chat view |
| **P2** | `notifications` | `userId` | `idx_notifications_user` | Used in notification list |
| **P2** | `notifications` | `createdAt` | `idx_notifications_created` | Used in notification ordering |
| **P2** | `maintenanceRequests` | `tenantId` | `idx_maintenance_tenant` | Used in tenant maintenance view |
| **P2** | `maintenanceRequests` | `propertyId` | `idx_maintenance_property` | Used in property maintenance view |
| **P2** | `conversations` | `participantIds` | — | JSON column — consider composite index or restructure |

### 5.3 Migration Script

```sql
-- P1 indexes (add in first migration)
CREATE INDEX idx_bookings_tenant ON bookings(tenantId);
CREATE INDEX idx_bookings_landlord ON bookings(landlordId);
CREATE INDEX idx_bookings_property ON bookings(propertyId);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking ON payments(bookingId);
CREATE INDEX idx_properties_landlord ON properties(landlordId);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_status ON properties(status);

-- P2 indexes (add in second migration)
CREATE INDEX idx_favorites_user ON favorites(userId);
CREATE INDEX idx_favorites_property ON favorites(propertyId);
CREATE INDEX idx_reviews_property ON reviews(propertyId);
CREATE INDEX idx_messages_conversation ON messages(conversationId);
CREATE INDEX idx_notifications_user ON notifications(userId);
CREATE INDEX idx_notifications_created ON notifications(createdAt);
CREATE INDEX idx_maintenance_tenant ON maintenanceRequests(tenantId);
CREATE INDEX idx_maintenance_property ON maintenanceRequests(propertyId);
```

### 5.4 Performance Impact

Adding indexes on empty or near-empty tables (current state: most tables have 0 rows) has negligible migration cost. The indexes will provide immediate benefit as data grows. For the `properties` table, a composite index `(city, status)` may be more efficient for search queries than two separate indexes; this should be evaluated after the search query patterns stabilize.

---

## 6. Database Connection Pool Configuration (P2 — 30 Days)

### 6.1 Current State

The main application creates a MySQL connection pool with default settings:

```typescript
// server/db.ts — CURRENT
const pool = mysql.createPool(process.env.DATABASE_URL!);
```

Additionally, `server/push.ts` creates a separate pool, and `server/routers.ts` creates a third pool (`sharedPool`). This means three independent pools compete for MySQL connections.

### 6.2 Target Configuration

Consolidate to a single shared pool with explicit limits:

```typescript
// server/db.ts — TARGET
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  connectionLimit: 10,        // Max connections in pool
  queueLimit: 50,             // Max queued requests before rejection
  waitForConnections: true,   // Queue requests when pool is full
  idleTimeout: 60000,         // Close idle connections after 60s
  enableKeepAlive: true,      // TCP keepalive for Railway's proxy
  keepAliveInitialDelay: 10000,
});
```

Export the pool instance and reuse it in `push.ts` and `routers.ts` instead of creating new pools.

---

## 7. Hub-API Database Comparison

The Hub-API PostgreSQL database demonstrates the target state for database integrity. It includes proper indexes, FK references via `.references()` with Drizzle, and uses PostgreSQL's built-in FK enforcement. The following table contrasts the two databases:

| Feature | Main App (MySQL) | Hub-API (PostgreSQL) |
|---------|-----------------|---------------------|
| Foreign keys | 0 constraints | All tables have FK references |
| Indexes | 3 non-PK | Multiple composite indexes per table |
| Transactions | Not used | Used in booking service |
| Connection pool | 3 separate pools, no limits | Single pool with config |
| Enum types | VARCHAR columns | PostgreSQL enum types |

The Hub-API serves as a reference implementation for the main application's database integrity improvements.

---

## 8. Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `drizzle/migrations/XXXX_add_foreign_keys.sql` | **New** | FK constraints for all 20 relationships |
| `drizzle/migrations/XXXX_add_indexes.sql` | **New** | 16 new indexes on frequently queried columns |
| `server/db.ts` | **Modify** | Add `withTransaction()` helper, configure pool limits, export shared pool |
| `server/routers.ts` | **Modify** | Wrap `approveBooking`, `confirmPayment`, `rejectBooking` in transactions |
| `server/push.ts` | **Modify** | Use shared pool from `db.ts` instead of creating new pool |
| `drizzle/schema.ts` | **Modify** | Add `refresh_tokens` table (from AUTH_SESSION_SPEC) |

**No Beds24 changes.** The Hub-API database and Beds24 SDK are not modified.  
**No Mansun dependency added.** All changes use standard Drizzle ORM and MySQL features.
