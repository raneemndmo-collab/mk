/**
 * Monthly Key Mobile — Pricing Engine
 *
 * Core formula: Monthly Rent = Daily Rate × 30 × (1 − discount%)
 * Default discount: 18%
 */

import type { BookingBreakdown, BookingTotalParams } from '../types';

/**
 * Calculate monthly rent from a daily rate with an optional discount.
 *
 * @param dailyRate - The daily rental rate in SAR
 * @param discountPercent - Discount percentage (0-100). Defaults to 18%.
 * @returns Monthly rent in SAR
 */
export function monthlyFromDaily(
  dailyRate: number,
  discountPercent: number = 18
): number {
  return dailyRate * 30 * (1 - discountPercent / 100);
}

/**
 * Calculate the full booking cost breakdown including VAT and deposit.
 *
 * VAT is calculated on (baseRent + serviceFee), NOT on rent alone.
 * Deposit is NOT included in the VAT calculation.
 *
 * @param params - Booking total parameters
 * @returns Full cost breakdown
 */
export function calculateBookingTotal(
  params: BookingTotalParams
): BookingBreakdown {
  const {
    monthlyRent,
    durationMonths,
    serviceFeePercent,
    vatPercent,
    depositMonths,
  } = params;

  const baseRent = monthlyRent * durationMonths;
  const serviceFee = baseRent * (serviceFeePercent / 100);
  const subtotal = baseRent + serviceFee;
  const vat = subtotal * (vatPercent / 100);
  const deposit = monthlyRent * depositMonths;
  const total = subtotal + vat + deposit;

  return {
    baseRent,
    serviceFee,
    vat,
    deposit,
    total,
  };
}

/**
 * Format a price value in SAR for display, respecting locale.
 *
 * @param amount - The amount in SAR
 * @param locale - 'ar' for Arabic, 'en' for English
 * @returns Formatted price string
 */
export function formatPrice(amount: number, locale: 'ar' | 'en'): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}
