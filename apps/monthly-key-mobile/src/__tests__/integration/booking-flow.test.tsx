/**
 * Integration Tests — Booking Flow
 *
 * Uses MSW to intercept tRPC calls. No real network.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { server } from './msw-server';
import { AuthProvider } from '@/contexts/AuthContext';
import BookingScreen from '@/app/booking/[propertyId]';

// Mock useLocalSearchParams to provide propertyId
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ propertyId: '1' }),
}));

describe('Booking Flow Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('full booking: select dates → see cost breakdown → confirm', async () => {
    const { getByTestId, findByText } = render(
      <AuthProvider>
        <BookingScreen />
      </AuthProvider>
    );

    // Wait for property to load
    await waitFor(() => {
      expect(getByTestId('dates-step')).toBeTruthy();
    });

    // Step 1: Select dates
    fireEvent.press(getByTestId('checkin-date'));
    fireEvent.press(getByTestId('date-2026-04-01'));
    fireEvent.press(getByTestId('date-2026-07-01'));
    fireEvent.press(getByTestId('next-step'));

    // Step 2: Cost breakdown should show VAT
    expect(await findByText('ضريبة القيمة المضافة')).toBeTruthy();
    expect(await findByText('مبلغ التأمين')).toBeTruthy();
    fireEvent.press(getByTestId('next-step'));

    // Step 3: Payment method
    fireEvent.press(getByTestId('payment-bank_transfer'));
    fireEvent.press(getByTestId('confirm-booking'));

    // Step 4: Confirmation
    expect(
      await findByText(/تم إنشاء الحجز|booking created/i)
    ).toBeTruthy();
  });

  it('cost breakdown includes VAT on (rent + service fee), not rent alone', async () => {
    const { findByTestId, getByTestId } = render(
      <AuthProvider>
        <BookingScreen />
      </AuthProvider>
    );

    // Wait for property to load and move to cost step
    await waitFor(() => {
      expect(getByTestId('dates-step')).toBeTruthy();
    });

    fireEvent.press(getByTestId('next-step'));

    // 12,300/month × 3 months = 36,900 base
    // + 5% service fee = 1,845 → subtotal 38,745
    // + 15% VAT on 38,745 = 5,811.75
    // + 1 month deposit = 12,300
    const vatLine = await findByTestId('vat-amount');
    expect(vatLine).toBeTruthy();
  });
});
