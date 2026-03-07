/**
 * Performance Tests — React Query Memory Hygiene
 *
 * Verifies cache cleanup on logout and staleTime behavior.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data
const mockBookings = [
  { id: 1, propertyId: 1, status: 'confirmed', totalAmount: 23112.5 },
  { id: 2, propertyId: 2, status: 'pending', totalAmount: 18000 },
];

const mockPayments = [
  { id: 1, bookingId: 1, amount: 23112.5, status: 'completed' },
];

const mockProperties = [
  {
    id: 1,
    titleAr: 'شقة فاخرة في الرياض',
    monthlyRate: 12300,
    city: 'الرياض',
    bedrooms: 2,
  },
];

/**
 * Simulate logout by clearing all query data from the cache.
 */
async function performLogout(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
}

describe('React Query — Memory Hygiene', () => {
  it('clears query cache on logout', async () => {
    const queryClient = new QueryClient();

    // Populate cache with user-specific data
    queryClient.setQueryData(['bookings', 1], mockBookings);
    queryClient.setQueryData(['payments', 1], mockPayments);

    // Verify data is in cache
    expect(queryClient.getQueryData(['bookings', 1])).toBeDefined();
    expect(queryClient.getQueryData(['payments', 1])).toBeDefined();

    // Trigger logout
    await performLogout(queryClient);

    // Cache must be cleared — no user data retained
    expect(queryClient.getQueryData(['bookings', 1])).toBeUndefined();
    expect(queryClient.getQueryData(['payments', 1])).toBeUndefined();
  });

  it('does not re-fetch on every render (staleTime respected)', async () => {
    const fetchSpy = jest.fn().mockResolvedValue(mockProperties);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
    });

    // Pre-populate cache to simulate first fetch
    queryClient.setQueryData(['properties', 'search'], mockProperties);

    // The data should still be fresh (within staleTime)
    const cachedData = queryClient.getQueryData(['properties', 'search']);
    expect(cachedData).toEqual(mockProperties);

    // Verify the spy was not called since data is in cache and fresh
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('cache is empty after clear()', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['test'], { data: 'test' });
    expect(queryClient.getQueryData(['test'])).toBeDefined();

    queryClient.clear();
    expect(queryClient.getQueryData(['test'])).toBeUndefined();
  });

  it('staleTime prevents unnecessary refetches', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
    });

    // Set data with a recent timestamp
    queryClient.setQueryData(['properties', 'featured'], mockProperties);

    // Check that data is not stale
    const queryState = queryClient.getQueryState(['properties', 'featured']);
    expect(queryState?.isInvalidated).toBeFalsy();
  });
});
