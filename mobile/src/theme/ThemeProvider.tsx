import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { palette, type ColorScheme, type ThemeColors } from './tokens';

/**
 * Theme state, mirroring next-themes on the web: three settings (light / dark /
 * follow the system) with the choice persisted, and `system` as the default so
 * the app matches the OS on first launch.
 */
export type ThemeSetting = ColorScheme | 'system';

const STORAGE_KEY = 'miab_theme';

interface ThemeContextValue {
  /** What the user picked — may be 'system'. */
  setting: ThemeSetting;
  /** What is actually being rendered — never 'system'. */
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (setting: ThemeSetting) => void;
  /** Cycles light → dark → light, for the quick toggle. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [setting, setSetting] = useState<ThemeSetting>('system');

  // Restore the stored preference. Until it resolves we follow the system,
  // which is the same behaviour as a fresh install rather than a flash of the
  // wrong theme.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setSetting(stored);
        }
      })
      .catch(() => {
        /* storage unavailable — stay on system */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemeSetting) => {
    setSetting(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* best effort; the choice still applies for this session */
    });
  }, []);

  const scheme: ColorScheme =
    setting === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : setting;

  const toggle = useCallback(() => {
    setTheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      setting,
      scheme,
      colors: palette[scheme],
      isDark: scheme === 'dark',
      setTheme,
      toggle,
    }),
    [setting, scheme, setTheme, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
