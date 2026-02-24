/**
 * Booking Service — Safe booking flow:
 *
 * 1. Validate dates & brand rules (CoBnB: 1-27 nights, MK: 28-365)
 * 2. Check availability (local DB or Beds24 if integrated)
 * 3. Idempotency check — same key returns cached response
 * 4. Create booking in local DB
 * 5. If integrated mode, push to Beds24
 * 6. Return booking
 */

import { eq, and, gte, lte, not, inArray } from "drizzle-orm";
import { db } from "../db/connection.js";
import { bookings, units, idempotencyStore } from "../db/schema.js";
import { isIntegrated, config } from "../config.js";
import { isFeatureEnabled } from "../lib/feature-flags.js";
import { logger } from "../lib/logger.js";
import { BRAND_RULES } from "@mk/shared";
import type { Brand, BookingCreateParams, Booking } from "@mk/shared";
import { createHash, randomUUID } from "crypto";

export class BookingService {
  /** Quote: calculate price without creating a booking. */
  async quote(params: {
    brand: Brand;
    unitId: string;
    checkIn: string;
    checkOut: string;
  }) {
    const unit = await db.query.units.findFirst({
      where: eq(units.id, params.unitId),
    });

    if (!unit) throw new ServiceError("Unit not found", 404);

    const checkIn = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000);

    this.validateNights(params.brand, nights);

    const pricePerNight = params.brand === "MONTHLYKEY"
      ? Math.round((unit.monthlyPrice ?? 0) / 30)
      : (unit.dailyPrice ?? 0);

    const total = pricePerNight * nights;

    const available = await this.checkLocalAvailability(params.unitId, params.checkIn, params.checkOut);

    return {
      unitId: params.unitId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights,
      pricePerNight,
      total,
      currency: unit.currency,
      available,
    };
  }

  /** Create a booking with idempotency protection. */
  async create(params: BookingCreateParams): Promise<Booking> {
    const checkIn = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000);

    // 1. Validate brand rules
    this.validateNights(params.brand, nights);

    // 2. Check availability
    const available = await this.checkLocalAvailability(params.unitId, params.checkIn, params.checkOut);
    if (!available) {
      throw new ServiceError("Unit is not available for the selected dates", 409);
    }

    // 3. Idempotency check
    const idempotencyKey = this.generateIdempotencyKey(params);
    const requestHash = this.hashRequest(params);

    const existing = await db.query.idempotencyStore.findFirst({
      where: eq(idempotencyStore.key, idempotencyKey),
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ServiceError("Idempotency key reused with different parameters", 422);
      }
      logger.info({ idempotencyKey }, "Returning cached booking response");
      return existing.responseBody as unknown as Booking;
    }

    // 4. Get unit for pricing
    const unit = await db.query.units.findFirst({
      where: eq(units.id, params.unitId),
    });
    if (!unit) throw new ServiceError("Unit not found", 404);

    const pricePerNight = params.brand === "MONTHLYKEY"
      ? Math.round((unit.monthlyPrice ?? 0) / 30)
      : (unit.dailyPrice ?? 0);
    const total = pricePerNight * nights;

    // 5. Create booking
    const [booking] = await db.insert(bookings).values({
      brand: params.brand,
      unitId: params.unitId,
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      guestPhone: params.guestPhone,
      checkIn,
      checkOut,
      nights,
      total,
      currency: unit.currency,
      status: "PENDING",
      paymentStatus: params.paymentMethod === "BANK_TRANSFER" ? "PENDING_BANK_TRANSFER" : "INITIATED",
      paymentMethod: params.paymentMethod,
      idempotencyKey,
      idempotencyHash: requestHash,
    }).returning();

    // 6. If integrated, push to Beds24
    if (isIntegrated(params.brand) && await isFeatureEnabled("ENABLE_BEDS24")) {
      try {
        // TODO: Push to Beds24 via SDK
        logger.info({ bookingId: booking.id }, "Would push to Beds24 in integrated mode");
      } catch (err) {
        logger.error({ err, bookingId: booking.id }, "Failed to push booking to Beds24");
        // Don't fail the booking — it's saved locally
      }
    }

    // 7. Cache idempotency response
    const bookingResponse = this.toBookingResponse(booking);
    await db.insert(idempotencyStore).values({
      key: idempotencyKey,
      requestHash,
      responseStatus: 201,
      responseBody: bookingResponse as unknown as Record<string, unknown>,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    }).onConflictDoNothing();

    return bookingResponse;
  }

  private validateNights(brand: Brand, nights: number) {
    const rules = BRAND_RULES[brand];
    if (nights < rules.minNights || nights > rules.maxNights) {
      throw new ServiceError(
        `${brand} requires ${rules.minNights}-${rules.maxNights} nights, got ${nights}`,
        400
      );
    }
  }

  private async checkLocalAvailability(
    unitId: string,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    const overlapping = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.unitId, unitId),
        not(inArray(bookings.status, ["CANCELLED", "NO_SHOW"])),
        lte(bookings.checkIn, new Date(checkOut)),
        gte(bookings.checkOut, new Date(checkIn))
      ),
    });
    return !overlapping;
  }

  private generateIdempotencyKey(params: BookingCreateParams): string {
    return `${params.brand}:${params.unitId}:${params.checkIn}:${params.checkOut}:${params.guestEmail}`;
  }

  private hashRequest(params: BookingCreateParams): string {
    return createHash("sha256").update(JSON.stringify(params)).digest("hex");
  }

  private toBookingResponse(row: typeof bookings.$inferSelect): Booking {
    return {
      id: row.id,
      brand: row.brand,
      unitId: row.unitId,
      beds24BookingId: row.beds24BookingId,
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      guestPhone: row.guestPhone,
      checkIn: row.checkIn.toISOString().split("T")[0],
      checkOut: row.checkOut.toISOString().split("T")[0],
      nights: row.nights,
      total: row.total,
      currency: row.currency,
      status: row.status,
      paymentStatus: row.paymentStatus,
      paymentMethod: row.paymentMethod,
      idempotencyKey: row.idempotencyKey,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

export class ServiceError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ServiceError";
  }
}
