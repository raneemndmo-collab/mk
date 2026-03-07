/**
 * Integration Tests — Property Search Flow
 *
 * Uses MSW to intercept tRPC calls. No real network.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { server } from './msw-server';
import SearchScreen from '@/app/(tabs)/search';

describe('Property Search Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('loads 20 properties on first render', async () => {
    const { getAllByTestId } = render(<SearchScreen />);
    await waitFor(() => {
      expect(getAllByTestId('property-card')).toHaveLength(20);
    });
  });

  it('loads next page on scroll to end', async () => {
    const { getByTestId, getAllByTestId } = render(<SearchScreen />);
    await waitFor(() =>
      expect(getAllByTestId('property-card')).toHaveLength(20)
    );

    fireEvent.scroll(getByTestId('property-list'), {
      nativeEvent: {
        contentOffset: { y: 5000 },
        contentSize: { height: 5000 },
        layoutMeasurement: { height: 800 },
      },
    });

    await waitFor(() => {
      expect(getAllByTestId('property-card').length).toBeGreaterThan(20);
    });
  });

  it('falls back to static cities when geo.all returns 404', async () => {
    const { getByTestId, getAllByTestId } = render(<SearchScreen />);
    fireEvent.press(getByTestId('filter-button'));

    await waitFor(() => {
      const cityOptions = getAllByTestId('city-option');
      expect(cityOptions.length).toBeGreaterThan(0);
      // Should show at least Riyadh from static fallback
      expect(
        cityOptions.some((el) =>
          el.props.children?.includes?.('الرياض')
        )
      ).toBeTruthy();
    });
  });
});
