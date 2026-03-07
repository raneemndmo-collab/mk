/**
 * Widget Tests — PropertyCard Component
 *
 * Isolated component tests with mocked data. No network calls.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PropertyCard } from '@/components/PropertyCard';
import type { Property } from '@/lib/types';

describe('PropertyCard', () => {
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

  it('renders Arabic title', () => {
    const { getByText } = render(<PropertyCard property={mockProperty} />);
    expect(getByText('شقة فاخرة في الرياض')).toBeTruthy();
  });

  it('renders formatted price badge', () => {
    const { getByText } = render(<PropertyCard property={mockProperty} />);
    // Should show monthly price in SAR
    expect(getByText(/12,300|١٢,٣٠٠/)).toBeTruthy();
  });

  it('renders city and district', () => {
    const { getByText } = render(<PropertyCard property={mockProperty} />);
    expect(getByText(/الرياض/)).toBeTruthy();
  });

  it('renders bedroom and bathroom counts', () => {
    const { getByText } = render(<PropertyCard property={mockProperty} />);
    expect(getByText('2')).toBeTruthy();
  });

  it('calls onPress with property id when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PropertyCard property={mockProperty} onPress={onPress} />
    );
    fireEvent.press(getByTestId('property-card'));
    expect(onPress).toHaveBeenCalledWith(1);
  });

  it('uses RTL-safe layout (no marginLeft/marginRight)', () => {
    const { getByTestId } = render(<PropertyCard property={mockProperty} />);
    const card = getByTestId('property-card');
    const flatStyle = Array.isArray(card.props.style)
      ? Object.assign({}, ...card.props.style)
      : card.props.style;
    expect(flatStyle.marginLeft).toBeUndefined();
    expect(flatStyle.marginRight).toBeUndefined();
  });

  it('renders cover photo', () => {
    const { getByTestId } = render(<PropertyCard property={mockProperty} />);
    const image = getByTestId('property-image');
    expect(image.props.source.uri).toBe('https://r2.monthlykey.com/test.jpg');
  });

  it('snapshot matches', () => {
    const tree = render(<PropertyCard property={mockProperty} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
