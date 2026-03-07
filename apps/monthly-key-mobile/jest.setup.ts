import '@testing-library/react-native/extend-expect';
import React from 'react';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[test-token-123]' })
  ),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: jest.fn() },
  Tabs: { Screen: jest.fn() },
}));

// Mock react-native maps
jest.mock('react-native-maps', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: (props: object) => React.createElement(RN.View, props),
    Marker: (props: object) => React.createElement(RN.View, props),
    Callout: (props: object) => React.createElement(RN.View, props),
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock I18nContext — default to Arabic
jest.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'ar',
    isRTL: true,
    setLocale: jest.fn(),
  }),
}));

// Mock ThemeContext — default to dark (navy)
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDark: true,
    colors: {
      primary: '#3ECFC0',
      background: '#0B1E2D',
      card: '#1A2F42',
      foreground: '#F0F0F0',
      border: '#374151',
    },
    toggleTheme: jest.fn(),
  }),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
