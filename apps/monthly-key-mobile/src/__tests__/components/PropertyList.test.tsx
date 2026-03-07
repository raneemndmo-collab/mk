/**
 * Widget Tests — PropertyList Component
 *
 * Isolated component tests with mocked data. No network calls.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PropertyList } from '@/components/PropertyList';
import type { Property } from '@/lib/types';

const createMockProperty = (id: number): Property => ({
  id,
  titleAr: `شقة رقم ${id} في الرياض`,
  dailyRate: 500,
  monthlyRate: 12300,
  city: 'الرياض',
  district: 'العليا',
  bedrooms: 2,
  bathrooms: 2,
  area: 120,
  photos: [{ url: `https://r2.monthlykey.com/prop${id}.jpg`, isCover: true }],
  status: 'active',
});

describe('PropertyList', () => {
  const mockProperties = Array.from({ length: 5 }, (_, i) =>
    createMockProperty(i + 1)
  );

  it('renders correct number of property cards', () => {
    const { getAllByTestId } = render(
      <PropertyList properties={mockProperties} />
    );
    expect(getAllByTestId('property-card')).toHaveLength(5);
  });

  it('renders empty state when no properties', () => {
    const { getByText } = render(<PropertyList properties={[]} />);
    // Uses i18n key from mock
    expect(getByText('search.noResults')).toBeTruthy();
  });

  it('uses keyExtractor with stable property id', () => {
    const { getByTestId } = render(
      <PropertyList properties={mockProperties} />
    );
    const list = getByTestId('property-list');
    expect(list.props.keyExtractor).toBeDefined();
  });

  it('passes initialNumToRender prop', () => {
    const { getByTestId } = render(
      <PropertyList properties={mockProperties} initialNumToRender={3} />
    );
    const list = getByTestId('property-list');
    expect(list.props.initialNumToRender).toBe(3);
  });

  it('snapshot matches', () => {
    const tree = render(<PropertyList properties={mockProperties} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
