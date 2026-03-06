/**
 * Integration Test — Booking Flow (Pure, No DB)
 *
 * Tests the full booking calculation pipeline:
 * Input validation → calculateBookingTotal → CalcResult shape → Halalah conversion
 *
 * Pure function tests — no database, no network, no side effects.
 */
import { describe, it, expect } from "vitest";
import {
  calculateBookingTotal,
  type CalcInput,
  type CalcSettings,
  type CalcResult,
} from "../../server/booking-calculator";

// ─── Fixtures ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: CalcSettings = {
  insuranceMode: "percentage",
  insuranceRate: 10,
  insuranceFixedAmount: 0,
  serviceFeeRate: 5,
  vatRate: 15,
  hideInsuranceFromTenant: false,
  currency: "SAR",
};

const FIXED_INSURANCE_SETTINGS: CalcSettings = {
  ...DEFAULT_SETTINGS,
  insuranceMode: "fixed",
  insuranceFixedAmount: 500,
};

const HIDDEN_INSURANCE_SETTINGS: CalcSettings = {
  ...DEFAULT_SETTINGS,
  hideInsuranceFromTenant: true,
};

// ─── Helper ──────────────────────────────────────────────────────────
function calc(rent: number, months: number, settings = DEFAULT_SETTINGS): CalcResult {
  return calculateBookingTotal({ monthlyRent: rent, durationMonths: months }, settings);
}

// ─── Tests ───────────────────────────────────────────────────────────
describe("Integration — Booking Flow", () => {
  describe("Standard Calculation (percentage insurance)", () => {
    it("calculates 1-month booking at 4500 SAR correctly", () => {
      const r = calc(4500, 1);
      expect(r.baseRentTotal).toBe(4500);
      expect(r.insuranceAmount).toBe(450);       // 4500 * 10%
      expect(r.serviceFeeAmount).toBe(225);       // 4500 * 5%
      expect(r.subtotal).toBe(5175);              // 4500 + 450 + 225
      expect(r.vatAmount).toBe(776);              // 5175 * 15% = 776.25 → 776
      expect(r.grandTotal).toBe(5951);            // 5175 + 776
      expect(r.currency).toBe("SAR");
    });

    it("calculates 3-month booking at 4500 SAR correctly", () => {
      const r = calc(4500, 3);
      expect(r.baseRentTotal).toBe(13500);        // 4500 * 3
      expect(r.insuranceAmount).toBe(450);         // based on monthly rent, not total
      expect(r.serviceFeeAmount).toBe(675);        // 13500 * 5%
      expect(r.subtotal).toBe(14625);
      expect(r.vatAmount).toBe(2194);              // 14625 * 15% = 2193.75 → 2194
      expect(r.grandTotal).toBe(16819);
    });

    it("calculates 12-month booking at 4500 SAR correctly", () => {
      const r = calc(4500, 12);
      expect(r.baseRentTotal).toBe(54000);
      expect(r.insuranceAmount).toBe(450);
      expect(r.serviceFeeAmount).toBe(2700);       // 54000 * 5%
      expect(r.subtotal).toBe(57150);
      expect(r.vatAmount).toBe(8573);              // 57150 * 15% = 8572.5 → 8573
      expect(r.grandTotal).toBe(65723);
    });
  });

  describe("Fixed Insurance Mode", () => {
    it("uses fixed insurance amount instead of percentage", () => {
      const r = calc(4500, 1, FIXED_INSURANCE_SETTINGS);
      expect(r.insuranceAmount).toBe(500);         // fixed, not 10% of 4500
      expect(r.appliedRates.insuranceMode).toBe("fixed");
    });

    it("fixed insurance is same regardless of rent amount", () => {
      const r1 = calc(2000, 1, FIXED_INSURANCE_SETTINGS);
      const r2 = calc(10000, 1, FIXED_INSURANCE_SETTINGS);
      expect(r1.insuranceAmount).toBe(500);
      expect(r2.insuranceAmount).toBe(500);
    });
  });

  describe("Hidden Insurance Mode", () => {
    it("merges insurance into display rent when hidden", () => {
      const r = calc(4500, 1, HIDDEN_INSURANCE_SETTINGS);
      expect(r.hideInsuranceFromTenant).toBe(true);
      expect(r.displayInsurance).toBe(0);
      expect(r.displayRentTotal).toBe(4500 + 450);  // rent + insurance merged
      // But actual insurance is still calculated for internal use
      expect(r.insuranceAmount).toBe(450);
    });

    it("grandTotal is identical whether insurance is hidden or shown", () => {
      const visible = calc(4500, 1, DEFAULT_SETTINGS);
      const hidden = calc(4500, 1, HIDDEN_INSURANCE_SETTINGS);
      expect(visible.grandTotal).toBe(hidden.grandTotal);
    });
  });

  describe("Halalah Conversion (Moyasar Gateway)", () => {
    it("converts SAR to halalah (×100) for payment gateway", () => {
      const r = calc(4500, 1);
      expect(r.amountHalalah).toBe(r.grandTotal * 100);
      expect(r.amountHalalah).toBe(595100);
    });

    it("halalah amount is always an integer", () => {
      const r = calc(3333, 1);
      expect(Number.isInteger(r.amountHalalah)).toBe(true);
    });

    it("records rounding rule", () => {
      const r = calc(4500, 1);
      expect(r.roundingRule).toBe("Math.round");
    });
  });

  describe("Applied Rates Snapshot", () => {
    it("freezes rate snapshot in result", () => {
      const r = calc(4500, 1);
      expect(r.appliedRates).toEqual({
        insuranceRate: 10,
        insuranceMode: "percentage",
        serviceFeeRate: 5,
        vatRate: 15,
        hideInsuranceFromTenant: false,
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles zero rent", () => {
      const r = calc(0, 1);
      expect(r.baseRentTotal).toBe(0);
      expect(r.insuranceAmount).toBe(0);
      expect(r.serviceFeeAmount).toBe(0);
      expect(r.grandTotal).toBe(0);
      expect(r.amountHalalah).toBe(0);
    });

    it("handles very large rent (100,000 SAR)", () => {
      const r = calc(100000, 12);
      expect(r.baseRentTotal).toBe(1200000);
      expect(r.grandTotal).toBeGreaterThan(0);
      expect(Number.isFinite(r.grandTotal)).toBe(true);
    });

    it("handles 1 month duration", () => {
      const r = calc(4500, 1);
      expect(r.baseRentTotal).toBe(4500);
    });

    it("all amounts are integers (no halalah fractions)", () => {
      const r = calc(3333, 7);
      expect(Number.isInteger(r.baseRentTotal)).toBe(true);
      expect(Number.isInteger(r.insuranceAmount)).toBe(true);
      expect(Number.isInteger(r.serviceFeeAmount)).toBe(true);
      expect(Number.isInteger(r.subtotal)).toBe(true);
      expect(Number.isInteger(r.vatAmount)).toBe(true);
      expect(Number.isInteger(r.grandTotal)).toBe(true);
      expect(Number.isInteger(r.amountHalalah)).toBe(true);
    });
  });

  describe("Deterministic Rounding", () => {
    it("produces identical results for same inputs", () => {
      const r1 = calc(4500, 3);
      const r2 = calc(4500, 3);
      expect(r1).toEqual(r2);
    });

    it("rounding is consistent across different rent values", () => {
      // Test a range of rents that produce fractional intermediate values
      for (const rent of [1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 9999]) {
        const r = calc(rent, 1);
        expect(Number.isInteger(r.grandTotal)).toBe(true);
        expect(Number.isInteger(r.vatAmount)).toBe(true);
      }
    });
  });
});
