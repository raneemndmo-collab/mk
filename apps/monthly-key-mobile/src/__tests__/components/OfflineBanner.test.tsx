/**
 * Widget Tests — OfflineBanner Component
 *
 * Tests offline/online banner visibility.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from '@/components/OfflineBanner';

// Override the useNetworkStatus mock per test
const mockUseNetworkStatus = jest.fn();

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

describe('OfflineBanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows Arabic offline message when disconnected', () => {
    mockUseNetworkStatus.mockReturnValue({ isConnected: false });
    const { getByText } = render(<OfflineBanner />);
    expect(getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy();
  });

  it('does not render when connected', () => {
    mockUseNetworkStatus.mockReturnValue({ isConnected: true });
    const { queryByText } = render(<OfflineBanner />);
    expect(queryByText('لا يوجد اتصال بالإنترنت')).toBeNull();
  });

  it('shows banner with correct testID when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isConnected: false });
    const { getByTestId } = render(<OfflineBanner />);
    expect(getByTestId('offline-banner')).toBeTruthy();
  });

  it('does not render banner testID when online', () => {
    mockUseNetworkStatus.mockReturnValue({ isConnected: true });
    const { queryByTestId } = render(<OfflineBanner />);
    expect(queryByTestId('offline-banner')).toBeNull();
  });
});
