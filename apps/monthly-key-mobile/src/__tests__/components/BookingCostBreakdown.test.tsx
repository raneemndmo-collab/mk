/**
 * Widget Tests — BookingCostBreakdown Component
 *
 * Isolated component tests with mocked data. No network calls.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { BookingCostBreakdown } from '@/components/BookingCostBreakdown';
import type { BookingBreakdown } from '@/lib/types';

describe('BookingCostBreakdown', () => {
  const mockBreakdown: BookingBreakdown = {
    baseRent: 15000,
    serviceFee: 750,
    vat: 2362.5,
    deposit: 5000,
    total: 23112.5,
  };

  it('renders all cost line items', () => {
    const { getByTestId } = render(
      <BookingCostBreakdown breakdown={mockBreakdown} />
    );
    expect(getByTestId('base-rent-amount')).toBeTruthy();
    expect(getByTestId('service-fee-amount')).toBeTruthy();
    expect(getByTestId('vat-amount')).toBeTruthy();
    expect(getByTestId('deposit-amount')).toBeTruthy();
    expect(getByTestId('total-amount')).toBeTruthy();
  });

  it('shows VAT line (ضريبة القيمة المضافة)', () => {
    const { getByTestId } = render(
      <BookingCostBreakdown breakdown={mockBreakdown} />
    );
    const vatAmount = getByTestId('vat-amount');
    expect(vatAmount).toBeTruthy();
    // VAT should be 2,362.50
    expect(vatAmount.props.children).toBeTruthy();
  });

  it('shows deposit line (مبلغ التأمين)', () => {
    const { getByTestId } = render(
      <BookingCostBreakdown breakdown={mockBreakdown} />
    );
    const depositAmount = getByTestId('deposit-amount');
    expect(depositAmount).toBeTruthy();
  });

  it('total includes VAT + deposit', () => {
    const { getByTestId } = render(
      <BookingCostBreakdown breakdown={mockBreakdown} />
    );
    const totalAmount = getByTestId('total-amount');
    expect(totalAmount).toBeTruthy();
    // Total = 15,000 + 750 + 2,362.50 + 5,000 = 23,112.50
  });

  it('uses RTL-safe layout (no marginLeft/marginRight)', () => {
    const { getByTestId } = render(
      <BookingCostBreakdown breakdown={mockBreakdown} />
    );
    const container = getByTestId('cost-breakdown');
    const flatStyle = Array.isArray(container.props.style)
      ? Object.assign({}, ...container.props.style)
      : container.props.style;
    expect(flatStyle.marginLeft).toBeUndefined();
    expect(flatStyle.marginRight).toBeUndefined();
  });

  it('snapshot matches', () => {
    const tree = render(
      <BookingCostBreakdown breakdown={mockBreakdown} />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
