/**
 * Integration Tests — Push Notification Registration
 *
 * Verifies correct endpoint usage (notification.subscribe, NOT registerPushToken).
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { server } from './msw-server';
import { AuthProvider } from '@/contexts/AuthContext';
import HomeScreen from '@/app/(tabs)/index';
import ProfileScreen from '@/app/(tabs)/profile';

describe('Push Notification Registration', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());

  it('calls notification.subscribe (not registerPushToken) after login', async () => {
    // Mock SecureStore to simulate logged-in state
    jest
      .spyOn(require('expo-secure-store'), 'getItemAsync')
      .mockResolvedValueOnce('mock-session-token');

    const fetchSpy = jest.spyOn(global, 'fetch');

    render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      const subscribeCalls = fetchSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('notification.subscribe')
      );
      expect(subscribeCalls.length).toBeGreaterThan(0);
    });

    // Verify registerPushToken was NOT called
    const wrongCalls = fetchSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('registerPushToken')
    );
    expect(wrongCalls.length).toBe(0);
  });

  it('does NOT call registerPushToken — wrong endpoint', async () => {
    jest
      .spyOn(require('expo-secure-store'), 'getItemAsync')
      .mockResolvedValueOnce('mock-session-token');

    const fetchSpy = jest.spyOn(global, 'fetch');

    render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    await new Promise((r) => setTimeout(r, 500));

    const wrongEndpointCalls = fetchSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('registerPushToken')
    );
    expect(wrongEndpointCalls).toHaveLength(0);
  });

  it('clears push token on logout', async () => {
    const deleteItemSpy = jest.spyOn(
      require('expo-secure-store'),
      'deleteItemAsync'
    );

    // Pre-set a token so user appears logged in
    jest
      .spyOn(require('expo-secure-store'), 'getItemAsync')
      .mockResolvedValueOnce('mock-session-token');

    render(
      <AuthProvider>
        <ProfileScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(deleteItemSpy).toHaveBeenCalledWith('push_token');
    });
  });
});
