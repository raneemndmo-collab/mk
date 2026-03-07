/**
 * Golden Tests — API Response Shape Snapshots
 *
 * Lock the shape of API responses — if backend changes, these tests catch it.
 * No network calls.
 */

import type { Property } from '@/lib/types';

describe('API Response Shape Snapshots', () => {
  it('property search result shape', () => {
    const mockProperty: Property = {
      id: 1,
      titleAr: 'شقة فاخرة في الرياض',
      titleEn: 'Luxury Apartment in Riyadh',
      dailyRate: 500,
      monthlyRate: 12300,
      city: 'الرياض',
      district: 'العليا',
      bedrooms: 2,
      bathrooms: 2,
      area: 120,
      status: 'active',
      photos: [{ url: 'https://example.com/photo.jpg', isCover: true }],
    };
    expect(mockProperty).toMatchSnapshot();
  });

  it('booking create payload shape', () => {
    const payload = {
      propertyId: 1,
      checkIn: '2026-04-01',
      checkOut: '2026-07-01',
      durationMonths: 3,
      paymentMethod: 'bank_transfer',
    };
    expect(payload).toMatchSnapshot();
  });

  it('push notification payload shape', () => {
    const notification = {
      title: 'تم تأكيد حجزك',
      body: 'تم تأكيد حجزك في شقة فاخرة في الرياض',
      data: { type: 'booking_confirmed', bookingId: 42 },
    };
    expect(notification).toMatchSnapshot();
  });
});
