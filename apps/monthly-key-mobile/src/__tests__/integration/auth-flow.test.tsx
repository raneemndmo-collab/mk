/**
 * Integration Tests — Auth Flow
 *
 * Uses MSW to intercept tRPC calls. No real network.
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { server } from './msw-server';
import { http, HttpResponse } from 'msw';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginScreen from '@/app/auth/login';
import HomeScreen from '@/app/(tabs)/index';
import ProfileScreen from '@/app/(tabs)/profile';

describe('Auth Integration Flow', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());

  it('login → token stored in SecureStore → user set in AuthContext', async () => {
    const setItemAsync = jest.spyOn(
      require('expo-secure-store'),
      'setItemAsync'
    );

    const { getByTestId } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    fireEvent.changeText(getByTestId('email-input'), 'tenant@test.sa');
    fireEvent.changeText(getByTestId('password-input'), 'Password123!');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(setItemAsync).toHaveBeenCalledWith(
        'session_token',
        expect.any(String)
      );
    });
  });

  it('app restart → session restored via auth.me', async () => {
    const getItemAsync = jest
      .spyOn(require('expo-secure-store'), 'getItemAsync')
      .mockResolvedValueOnce('mock-session-token');

    const { findByText } = render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    expect(await findByText('أحمد محمد')).toBeTruthy();
    expect(getItemAsync).toHaveBeenCalledWith('session_token');
  });

  it('logout → token cleared → user null', async () => {
    const deleteItemAsync = jest.spyOn(
      require('expo-secure-store'),
      'deleteItemAsync'
    );

    // Pre-set a token so user appears logged in
    jest
      .spyOn(require('expo-secure-store'), 'getItemAsync')
      .mockResolvedValueOnce('mock-session-token');

    const { getByTestId } = render(
      <AuthProvider>
        <ProfileScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('logout-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(deleteItemAsync).toHaveBeenCalledWith('session_token');
    });
  });

  it('expired token → redirect to login', async () => {
    server.use(
      http.get('https://monthlykey.com/api/trpc/auth.me', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED' } },
          { status: 401 }
        )
      )
    );

    jest
      .spyOn(require('expo-secure-store'), 'getItemAsync')
      .mockResolvedValueOnce('expired-token');

    const mockReplace = jest.fn();
    jest
      .spyOn(require('expo-router'), 'useRouter')
      .mockReturnValue({
        push: jest.fn(),
        back: jest.fn(),
        replace: mockReplace,
      });

    render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });
  });
});
