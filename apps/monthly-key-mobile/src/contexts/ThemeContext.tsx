import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ThemeColors } from '@/lib/types';

// ─── Theme Definitions ──────────────────────────────────────────────────────

const darkColors: ThemeColors = {
  primary: '#3ECFC0',
  background: '#0B1E2D',
  card: '#1A2F42',
  foreground: '#F0F0F0',
  border: '#374151',
};

const lightColors: ThemeColors = {
  primary: '#3ECFC0',
  background: '#F5F7FA',
  card: '#FFFFFF',
  foreground: '#1A1A2E',
  border: '#E5E7EB',
};

// ─── Context ────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialDark?: boolean;
}

export function ThemeProvider({ children, initialDark = true }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(initialDark);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ isDark, colors, toggleTheme }),
    [isDark, colors, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
