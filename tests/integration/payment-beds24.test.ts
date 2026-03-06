/**
 * Integration Test — Payment & Beds24 Payload Structures
 *
 * Validates the shape and constraints of Moyasar payment params,
 * Beds24 booking sync interfaces, and reconciliation report structures.
 * Pure type/shape tests — no network calls, no API keys needed.
 */
import { describe, it, expect } from "vitest";
import type {
  CreateMoyasarPaymentParams,
  MoyasarSettings,
  PaymentMethodInfo,
} from "../../server/moyasar";
import type {
  Beds24Booking,
  SyncResult,
  ReconciliationMismatch,
  ReconciliationReport,
} from "../../server/beds24-sync";
import { calculateBookingTotal } from "../../server/booking-calculator";

// ─── Moyasar Payment Params ──────────────────────────────────────────
describe("Integration — Moyasar Payment Payload", () => {
  describe("CreateMoyasarPaymentParams Shape", () => {
    it("constructs valid creditcard payment params from booking calc", () => {
      const calcResult = calculateBookingTotal(
        { monthlyRent: 4500, durationMonths: 1 },
        {
          insuranceMode: "percentage",
          insuranceRate: 10,
          insuranceFixedAmount: 0,
          serviceFeeRate: 5,
          vatRate: 15,
          hideInsuranceFromTenant: false,
          currency: "SAR",
        }
      );

      const params: CreateMoyasarPaymentParams = {
        bookingId: 1001,
        amount: calcResult.grandTotal,
        description: `Booking #1001 — 1 month at 4,500 SAR`,
        descriptionAr: "حجز #1001 — شهر واحد بسعر 4,500 ريال",
        callbackUrl: "https://monthlykey.com/payment/callback",
        source: {
          type: "creditcard",
          token: "tok_test_abc123",
        },
        metadata: {
          bookingId: "1001",
          tenantId: "42",
          propertyId: "7",
        },
      };

      expect(params.amount).toBe(5951);
      expect(params.bookingId).toBe(1001);
      expect(params.source.type).toBe("creditcard");
      expect(params.source.token).toBeTruthy();
      expect(params.callbackUrl).toContain("https://");
      expect(params.metadata?.bookingId).toBe("1001");
    });

    it("constructs valid Apple Pay payment params", () => {
      const params: CreateMoyasarPaymentParams = {
        bookingId: 1002,
        amount: 5951,
        description: "Booking #1002",
        callbackUrl: "https://monthlykey.com/payment/callback",
        source: {
          type: "applepay",
          paymentData: { version: "EC_v1", data: "encrypted..." },
        },
      };

      expect(params.source.type).toBe("applepay");
      expect(params.source.paymentData).toBeTruthy();
      expect(params.source.token).toBeUndefined();
    });

    it("amount in halalah is grandTotal × 100", () => {
      const calcResult = calculateBookingTotal(
        { monthlyRent: 4500, durationMonths: 1 },
        {
          insuranceMode: "percentage",
          insuranceRate: 10,
          insuranceFixedAmount: 0,
          serviceFeeRate: 5,
          vatRate: 15,
          hideInsuranceFromTenant: false,
          currency: "SAR",
        }
      );

      expect(calcResult.amountHalalah).toBe(calcResult.grandTotal * 100);
      expect(Number.isInteger(calcResult.amountHalalah)).toBe(true);
    });
  });

  describe("MoyasarSettings Shape", () => {
    it("validates settings structure", () => {
      const settings: MoyasarSettings = {
        enabled: true,
        mode: "test",
        publishableKey: "pk_test_abc",
        secretKey: "sk_test_xyz",
        supportedMethods: ["creditcard", "applepay"],
        callbackUrl: "https://monthlykey.com/payment/callback",
        webhookSecret: "whsec_test",
      };

      expect(settings.enabled).toBe(true);
      expect(settings.mode).toMatch(/^(test|live)$/);
      expect(settings.publishableKey).toMatch(/^pk_/);
      expect(settings.secretKey).toMatch(/^sk_/);
      expect(settings.supportedMethods).toContain("creditcard");
    });
  });

  describe("PaymentMethodInfo Shape", () => {
    it("validates payment method badge structure", () => {
      const badge: PaymentMethodInfo = {
        key: "mada_card",
        provider: "moyasar",
        label: "mada Card",
        labelAr: "بطاقة مدى",
        logoPath: "/payment-logos/mada.svg",
        displayOrder: 1,
        isOnline: true,
      };

      expect(badge.key).toBeTruthy();
      expect(badge.provider).toBe("moyasar");
      expect(badge.labelAr).toContain("مدى");
      expect(badge.displayOrder).toBeGreaterThan(0);
      expect(badge.isOnline).toBe(true);
    });
  });
});

// ─── Beds24 Sync Payloads ────────────────────────────────────────────
describe("Integration — Beds24 Sync Payloads", () => {
  describe("Beds24Booking Shape", () => {
    it("validates inbound booking structure", () => {
      const booking: Beds24Booking = {
        id: 50001,
        propertyId: 7,
        roomId: 101,
        unitId: 1,
        status: "confirmed",
        arrival: "2026-04-01",
        departure: "2026-05-01",
        firstName: "Ahmed",
        lastName: "Al-Saud",
        email: "ahmed@example.com",
        phone: "+966501234567",
        numAdult: 2,
        numChild: 0,
        price: 4500,
        deposit: 450,
        tax: 776,
        apiSource: "monthlykey",
        channel: "direct",
        bookingTime: "2026-03-15T10:00:00Z",
      };

      expect(booking.id).toBeGreaterThan(0);
      expect(booking.status).toMatch(
        /^(confirmed|request|new|cancelled|black|inquiry)$/
      );
      expect(booking.arrival).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(booking.departure).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(booking.departure) > new Date(booking.arrival)).toBe(true);
    });

    it("handles minimal booking (only required fields)", () => {
      const booking: Beds24Booking = {
        id: 50002,
        propertyId: 8,
        roomId: 102,
        status: "new",
        arrival: "2026-06-01",
        departure: "2026-07-01",
      };

      expect(booking.firstName).toBeUndefined();
      expect(booking.email).toBeUndefined();
      expect(booking.price).toBeUndefined();
    });

    it("validates all status values", () => {
      const statuses: Beds24Booking["status"][] = [
        "confirmed", "request", "new", "cancelled", "black", "inquiry",
      ];

      statuses.forEach((status) => {
        const booking: Beds24Booking = {
          id: 1,
          propertyId: 1,
          roomId: 1,
          status,
          arrival: "2026-01-01",
          departure: "2026-02-01",
        };
        expect(booking.status).toBe(status);
      });
    });
  });

  describe("SyncResult Shape", () => {
    it("validates sync result counters", () => {
      const result: SyncResult = {
        created: 5,
        updated: 3,
        cancelled: 1,
        skipped: 2,
        errors: [],
      };

      expect(result.created).toBeGreaterThanOrEqual(0);
      expect(result.updated).toBeGreaterThanOrEqual(0);
      expect(result.cancelled).toBeGreaterThanOrEqual(0);
      expect(result.skipped).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("validates sync result with errors", () => {
      const result: SyncResult = {
        created: 3,
        updated: 0,
        cancelled: 0,
        skipped: 0,
        errors: [
          "Booking #50003: property not found in MK",
          "Booking #50004: date overlap with existing booking",
        ],
      };

      expect(result.errors.length).toBe(2);
      expect(result.errors[0]).toContain("50003");
    });
  });

  describe("ReconciliationReport Shape", () => {
    it("validates reconciliation report structure", () => {
      const report: ReconciliationReport = {
        runAt: new Date().toISOString(),
        totalBeds24: 150,
        totalMK: 148,
        mismatches: [
          {
            type: "MISSING_IN_MK",
            beds24BookingId: 50010,
            description: "Booking exists in Beds24 but not in MK",
          },
          {
            type: "STATUS_MISMATCH",
            beds24BookingId: 50011,
            mkBookingId: 1050,
            beds24Status: "confirmed",
            mkStatus: "cancelled",
            description: "Status differs between systems",
          },
        ],
      };

      expect(report.totalBeds24).toBeGreaterThanOrEqual(report.totalMK);
      expect(report.mismatches.length).toBe(2);
      expect(report.mismatches[0].type).toBe("MISSING_IN_MK");
      expect(report.mismatches[1].type).toBe("STATUS_MISMATCH");
    });

    it("validates all mismatch types", () => {
      const types: ReconciliationMismatch["type"][] = [
        "MISSING_IN_MK",
        "MISSING_IN_BEDS24",
        "STATUS_MISMATCH",
        "DATE_MISMATCH",
      ];

      types.forEach((type) => {
        const mismatch: ReconciliationMismatch = {
          type,
          description: `Test mismatch of type ${type}`,
        };
        expect(mismatch.type).toBe(type);
      });
    });
  });
});
