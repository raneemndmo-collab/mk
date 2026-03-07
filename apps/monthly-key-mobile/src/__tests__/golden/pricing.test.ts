/**
 * Golden Tests — Pricing Engine
 *
 * Lock expected outputs for core calculations. No network calls.
 * Core formula: Monthly Rent = Daily Rate × 30 × (1 − discount%)
 * Default discount: 18%
 */

import {
  monthlyFromDaily,
  calculateBookingTotal,
  formatPrice,
} from '@/lib/utils/pricing';

describe('Pricing Engine — Golden Tests', () => {
  describe('monthlyFromDaily()', () => {
    it('applies 18% default discount correctly', () => {
      // 500 SAR/day × 30 × 0.82 = 12,300 SAR/month
      expect(monthlyFromDaily(500)).toBe(12300);
    });

    it('applies 0% discount (no discount)', () => {
      // 500 × 30 × 1.0 = 15,000
      expect(monthlyFromDaily(500, 0)).toBe(15000);
    });

    it('applies 50% discount', () => {
      // 500 × 30 × 0.5 = 7,500
      expect(monthlyFromDaily(500, 50)).toBe(7500);
    });

    it('returns 0 for zero daily rate', () => {
      expect(monthlyFromDaily(0)).toBe(0);
    });

    it('handles fractional daily rates', () => {
      expect(monthlyFromDaily(333.33)).toBeCloseTo(8199.918, 2);
    });
  });

  describe('calculateBookingTotal()', () => {
    const baseParams = {
      monthlyRent: 5000,
      durationMonths: 3,
      serviceFeePercent: 5,
      vatPercent: 15,
      depositMonths: 1,
    };

    it('calculates full breakdown correctly', () => {
      const result = calculateBookingTotal(baseParams);
      // baseRent = 5000 × 3 = 15,000
      // serviceFee = 15,000 × 0.05 = 750
      // subtotal = 15,750
      // vat = 15,750 × 0.15 = 2,362.50
      // deposit = 5,000 × 1 = 5,000
      // total = 15,750 + 2,362.50 + 5,000 = 23,112.50
      expect(result.baseRent).toBe(15000);
      expect(result.serviceFee).toBe(750);
      expect(result.vat).toBe(2362.5);
      expect(result.deposit).toBe(5000);
      expect(result.total).toBe(23112.5);
    });

    it('snapshot matches expected breakdown shape', () => {
      expect(calculateBookingTotal(baseParams)).toMatchSnapshot();
    });

    it('handles minimum stay of 1 month', () => {
      const result = calculateBookingTotal({ ...baseParams, durationMonths: 1 });
      expect(result.baseRent).toBe(5000);
    });

    it('handles maximum stay of 12 months', () => {
      const result = calculateBookingTotal({ ...baseParams, durationMonths: 12 });
      expect(result.baseRent).toBe(60000);
    });

    it('VAT is calculated on (rent + service fee), not rent alone', () => {
      const result = calculateBookingTotal(baseParams);
      const expectedVatBase = result.baseRent + result.serviceFee;
      expect(result.vat).toBeCloseTo(expectedVatBase * 0.15, 2);
    });

    it('deposit is not included in VAT calculation', () => {
      const withDeposit = calculateBookingTotal({ ...baseParams, depositMonths: 2 });
      const withoutDeposit = calculateBookingTotal({ ...baseParams, depositMonths: 0 });
      // VAT should be the same — deposit is excluded from VAT
      expect(withDeposit.vat).toBe(withoutDeposit.vat);
    });
  });

  describe('formatPrice()', () => {
    it('formats SAR in Arabic locale', () => {
      expect(formatPrice(8500, 'ar')).toMatchSnapshot();
    });
    it('formats SAR in English locale', () => {
      expect(formatPrice(8500, 'en')).toMatchSnapshot();
    });
    it('formats zero', () => {
      expect(formatPrice(0, 'ar')).toMatchSnapshot();
    });
  });
});
