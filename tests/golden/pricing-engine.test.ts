/**
 * Golden Tests — Pricing Engine
 *
 * Pure, deterministic snapshot tests for calculateBookingTotal.
 * No external calls, no DB, no API — pure function testing.
 * All amounts in SAR, rounded integers (Math.round).
 */
import { describe, it, expect } from "vitest";
import {
  calculateBookingTotal,
  parseCalcSettings,
  type CalcInput,
  type CalcSettings,
} from "../../server/booking-calculator";

// ─── Default Settings (Saudi market defaults) ────────────────────────
const DEFAULT_SETTINGS: CalcSettings = {
  insuranceMode: "percentage",
  insuranceRate: 10,
  insuranceFixedAmount: 0,
  serviceFeeRate: 5,
  vatRate: 15,
  hideInsuranceFromTenant: false,
  currency: "SAR",
};

// ─── Helper ──────────────────────────────────────────────────────────
function calc(monthlyRent: number, durationMonths: number, overrides?: Partial<CalcSettings>) {
  const input: CalcInput = { monthlyRent, durationMonths };
  const settings: CalcSettings = { ...DEFAULT_SETTINGS, ...overrides };
  return calculateBookingTotal(input, settings);
}

// ─── Test Suite ──────────────────────────────────────────────────────
describe("Golden Tests — Pricing Engine", () => {
  describe("Standard Scenarios", () => {
    it("4500 SAR × 1 month (10% ins, 5% svc, 15% VAT) → 5951 SAR", () => {
      const result = calc(4500, 1);
      // baseRent = 4500 × 1 = 4500
      // insurance = 4500 × 10% = 450
      // serviceFee = 4500 × 5% = 225
      // subtotal = 4500 + 450 + 225 = 5175
      // VAT = 5175 × 15% = 776 (rounded)
      // grandTotal = 5175 + 776 = 5951
      expect(result.baseRentTotal).toBe(4500);
      expect(result.insuranceAmount).toBe(450);
      expect(result.serviceFeeAmount).toBe(225);
      expect(result.subtotal).toBe(5175);
      expect(result.vatAmount).toBe(776);
      expect(result.grandTotal).toBe(5951);
      expect(result.amountHalalah).toBe(595100);
      expect(result.currency).toBe("SAR");
    });

    it("4500 SAR × 3 months", () => {
      const result = calc(4500, 3);
      // baseRent = 4500 × 3 = 13500
      // insurance = 4500 × 10% = 450 (based on monthly, not total)
      // serviceFee = 13500 × 5% = 675
      // subtotal = 13500 + 450 + 675 = 14625
      // VAT = 14625 × 15% = 2194 (rounded)
      // grandTotal = 14625 + 2194 = 16819
      expect(result.baseRentTotal).toBe(13500);
      expect(result.insuranceAmount).toBe(450);
      expect(result.serviceFeeAmount).toBe(675);
      expect(result.subtotal).toBe(14625);
      expect(result.vatAmount).toBe(2194);
      expect(result.grandTotal).toBe(16819);
    });

    it("10000 SAR × 6 months", () => {
      const result = calc(10000, 6);
      expect(result.baseRentTotal).toBe(60000);
      expect(result.insuranceAmount).toBe(1000);
      expect(result.serviceFeeAmount).toBe(3000);
      expect(result.subtotal).toBe(64000);
      expect(result.vatAmount).toBe(9600);
      expect(result.grandTotal).toBe(73600);
    });

    it("2000 SAR × 12 months", () => {
      const result = calc(2000, 12);
      expect(result.baseRentTotal).toBe(24000);
      expect(result.insuranceAmount).toBe(200);
      expect(result.serviceFeeAmount).toBe(1200);
      expect(result.subtotal).toBe(25400);
      expect(result.vatAmount).toBe(3810);
      expect(result.grandTotal).toBe(29210);
    });
  });

  describe("Edge Cases", () => {
    it("0% discount / 100% occupancy (minimum 1 month)", () => {
      const result = calc(5000, 1, {
        insuranceRate: 0,
        serviceFeeRate: 0,
        vatRate: 0,
      });
      expect(result.baseRentTotal).toBe(5000);
      expect(result.insuranceAmount).toBe(0);
      expect(result.serviceFeeAmount).toBe(0);
      expect(result.vatAmount).toBe(0);
      expect(result.grandTotal).toBe(5000);
    });

    it("minimum stay: 1 month at minimum rent", () => {
      const result = calc(1, 1);
      expect(result.baseRentTotal).toBe(1);
      expect(result.insuranceAmount).toBe(0); // Math.round(1 × 0.1) = 0
      expect(result.serviceFeeAmount).toBe(0); // Math.round(1 × 0.05) = 0
      expect(result.subtotal).toBe(1);
      expect(result.vatAmount).toBe(0); // Math.round(1 × 0.15) = 0
      expect(result.grandTotal).toBe(1);
    });

    it("very high rent: 100,000 SAR × 1 month", () => {
      const result = calc(100000, 1);
      expect(result.baseRentTotal).toBe(100000);
      expect(result.insuranceAmount).toBe(10000);
      expect(result.serviceFeeAmount).toBe(5000);
      expect(result.subtotal).toBe(115000);
      expect(result.vatAmount).toBe(17250);
      expect(result.grandTotal).toBe(132250);
    });

    it("fractional rent: 3333 SAR × 1 month (tests rounding)", () => {
      const result = calc(3333, 1);
      // insurance = Math.round(3333 × 0.10) = Math.round(333.3) = 333
      // serviceFee = Math.round(3333 × 0.05) = Math.round(166.65) = 167
      // subtotal = 3333 + 333 + 167 = 3833
      // VAT = Math.round(3833 × 0.15) = Math.round(574.95) = 575
      // grandTotal = 3833 + 575 = 4408
      expect(result.baseRentTotal).toBe(3333);
      expect(result.insuranceAmount).toBe(333);
      expect(result.serviceFeeAmount).toBe(167);
      expect(result.subtotal).toBe(3833);
      expect(result.vatAmount).toBe(575);
      expect(result.grandTotal).toBe(4408);
    });
  });

  describe("Fixed Insurance Mode", () => {
    it("fixed insurance of 500 SAR", () => {
      const result = calc(4500, 1, {
        insuranceMode: "fixed",
        insuranceFixedAmount: 500,
      });
      // insurance = 500 (fixed, not percentage)
      // serviceFee = Math.round(4500 × 0.05) = 225
      // subtotal = 4500 + 500 + 225 = 5225
      // VAT = Math.round(5225 × 0.15) = Math.round(783.75) = 784
      // grandTotal = 5225 + 784 = 6009
      expect(result.insuranceAmount).toBe(500);
      expect(result.subtotal).toBe(5225);
      expect(result.vatAmount).toBe(784);
      expect(result.grandTotal).toBe(6009);
    });

    it("fixed insurance of 0 SAR", () => {
      const result = calc(4500, 1, {
        insuranceMode: "fixed",
        insuranceFixedAmount: 0,
      });
      expect(result.insuranceAmount).toBe(0);
    });
  });

  describe("Hidden Insurance Display", () => {
    it("insurance hidden from tenant: merged into rent display", () => {
      const result = calc(4500, 1, { hideInsuranceFromTenant: true });
      // Core amounts unchanged
      expect(result.baseRentTotal).toBe(4500);
      expect(result.insuranceAmount).toBe(450);
      expect(result.grandTotal).toBe(5951);
      // Display variants changed
      expect(result.displayRentTotal).toBe(4950); // 4500 + 450
      expect(result.displayInsurance).toBe(0);     // hidden
      expect(result.displaySubtotal).toBe(5175);   // 4950 + 225
      expect(result.hideInsuranceFromTenant).toBe(true);
    });

    it("insurance visible to tenant: separate line items", () => {
      const result = calc(4500, 1, { hideInsuranceFromTenant: false });
      expect(result.displayRentTotal).toBe(4500);
      expect(result.displayInsurance).toBe(450);
      expect(result.displaySubtotal).toBe(5175);
      expect(result.hideInsuranceFromTenant).toBe(false);
    });
  });

  describe("Applied Rates Snapshot", () => {
    it("freezes applied rates at calculation time", () => {
      const result = calc(4500, 1);
      expect(result.appliedRates).toEqual({
        insuranceRate: 10,
        insuranceMode: "percentage",
        serviceFeeRate: 5,
        vatRate: 15,
        hideInsuranceFromTenant: false,
      });
      expect(result.roundingRule).toBe("Math.round");
    });
  });

  describe("Halalah Conversion", () => {
    it("amountHalalah = grandTotal × 100 (integer)", () => {
      const result = calc(4500, 1);
      expect(result.amountHalalah).toBe(result.grandTotal * 100);
      expect(Number.isInteger(result.amountHalalah)).toBe(true);
    });

    it("amountHalalah for large amounts", () => {
      const result = calc(50000, 6);
      expect(result.amountHalalah).toBe(result.grandTotal * 100);
      expect(Number.isInteger(result.amountHalalah)).toBe(true);
    });
  });

  describe("parseCalcSettings", () => {
    it("parses DB settings record to CalcSettings", () => {
      const dbRecord: Record<string, string> = {
        "calculator.insuranceMode": "percentage",
        "fees.depositPercent": "10",
        "calculator.insuranceFixedAmount": "0",
        "fees.serviceFeePercent": "5",
        "fees.vatPercent": "15",
        "calculator.hideInsuranceFromTenant": "false",
        "payment.currency": "SAR",
      };
      const settings = parseCalcSettings(dbRecord);
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it("uses defaults for missing DB keys", () => {
      const settings = parseCalcSettings({});
      expect(settings.insuranceMode).toBe("percentage");
      expect(settings.insuranceRate).toBe(10);
      expect(settings.serviceFeeRate).toBe(5);
      expect(settings.vatRate).toBe(15);
      expect(settings.currency).toBe("SAR");
    });

    it("parses fixed insurance mode", () => {
      const settings = parseCalcSettings({
        "calculator.insuranceMode": "fixed",
        "calculator.insuranceFixedAmount": "750",
      });
      expect(settings.insuranceMode).toBe("fixed");
      expect(settings.insuranceFixedAmount).toBe(750);
    });
  });

  describe("Full Snapshot — Regression Lock", () => {
    it("locks full output for 4500 SAR × 1 month standard scenario", () => {
      const result = calc(4500, 1);
      expect(result).toMatchSnapshot();
    });

    it("locks full output for 10000 SAR × 6 months", () => {
      const result = calc(10000, 6);
      expect(result).toMatchSnapshot();
    });

    it("locks full output for hidden insurance scenario", () => {
      const result = calc(4500, 1, { hideInsuranceFromTenant: true });
      expect(result).toMatchSnapshot();
    });

    it("locks full output for fixed insurance 500 SAR", () => {
      const result = calc(4500, 1, {
        insuranceMode: "fixed",
        insuranceFixedAmount: 500,
      });
      expect(result).toMatchSnapshot();
    });
  });
});
