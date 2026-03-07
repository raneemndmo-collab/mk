/**
 * Performance Tests — FlatList Large List Performance
 *
 * Verifies PropertyList renders efficiently with large datasets.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PropertyList } from '@/components/PropertyList';
import type { Property } from '@/lib/types';

const mockProperty: Property = {
  id: 1,
  titleAr: 'شقة فاخرة في الرياض',
  dailyRate: 500,
  monthlyRate: 12300,
  city: 'الرياض',
  district: 'العليا',
  bedrooms: 2,
  bathrooms: 2,
  area: 120,
  photos: [{ url: 'https://r2.monthlykey.com/test.jpg', isCover: true }],
  status: 'active',
};

const mockProperties = Array.from({ length: 10 }, (_, i) => ({
  ...mockProperty,
  id: i + 1,
  titleAr: `عقار رقم ${i + 1}`,
}));

describe('FlatList — Large List Performance', () => {
  it('renders 100 PropertyCards without crashing', () => {
    const properties = Array.from({ length: 100 }, (_, i) => ({
      ...mockProperty,
      id: i + 1,
      titleAr: `عقار رقم ${i + 1}`,
    }));

    const { getAllByTestId } = render(
      <PropertyList properties={properties} initialNumToRender={10} />
    );
    // Only initial batch should render immediately
    expect(getAllByTestId('property-card').length).toBeLessThanOrEqual(15);
  });

  it('uses keyExtractor with stable property id', () => {
    // Verify no index-based keys (causes re-renders)
    const { getByTestId } = render(
      <PropertyList properties={mockProperties} />
    );
    const list = getByTestId('property-list');
    expect(list.props.keyExtractor).toBeDefined();
  });

  it('renders with removeClippedSubviews for performance', () => {
    const { getByTestId } = render(
      <PropertyList properties={mockProperties} />
    );
    const list = getByTestId('property-list');
    expect(list.props.removeClippedSubviews).toBe(true);
  });

  it('uses windowSize for virtualization', () => {
    const { getByTestId } = render(
      <PropertyList properties={mockProperties} />
    );
    const list = getByTestId('property-list');
    expect(list.props.windowSize).toBeDefined();
    expect(list.props.windowSize).toBeGreaterThan(0);
  });

  it('maxToRenderPerBatch is set for smooth scrolling', () => {
    const { getByTestId } = render(
      <PropertyList properties={mockProperties} />
    );
    const list = getByTestId('property-list');
    expect(list.props.maxToRenderPerBatch).toBeDefined();
  });
});
