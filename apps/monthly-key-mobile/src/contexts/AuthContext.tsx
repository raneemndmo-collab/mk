import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { trpc } from '@/lib/api/client';
import type { User, AuthState } from '@/lib/types';

// ─── Context ────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  restoreSession: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ─── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = user !== null && token !== null;

  // Subscribe to push notifications after login
  const subscribePushNotifications = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;

      await trpc.notification.subscribe.mutate({
        token: pushToken,
        platform: Platform.OS,
      });

      await SecureStore.setItemAsync('push_token', pushToken);
    } catch {
      // Silently fail — push is optional
    }
  }, []);

  // Restore session on app start
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await SecureStore.getItemAsync('session_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const userData = (await trpc.auth.me.query()) as User;
      setUser(userData);
      await subscribePushNotifications();
    } catch {
      // Token expired or invalid
      await SecureStore.deleteItemAsync('session_token');
      setUser(null);
      setToken(null);
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, subscribePushNotifications]);

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      const result = (await trpc.auth.login.mutate({ email, password })) as User & {
        token?: string;
      };
      const sessionToken = result.token || 'session-token';
      await SecureStore.setItemAsync('session_token', sessionToken);
      setToken(sessionToken);
      setUser(result);
      await subscribePushNotifications();
    },
    [subscribePushNotifications]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await trpc.notification.unsubscribe.mutate({});
    } catch {
      // Ignore
    }
    await SecureStore.deleteItemAsync('session_token');
    await SecureStore.deleteItemAsync('push_token');
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      restoreSession,
    }),
    [user, token, isAuthenticated, isLoading, login, logout, restoreSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
