import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';
export const THEME_STORAGE_KEY = 'rac3011.theme';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): ThemePreference | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    // If the browser still has old 'dark' or 'system' cached from the teammate's previous setup,
    // reset it to 'light' so the user sees the vibrant brand appearance.
    if (v === 'dark' || v === 'system') {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
    return 'light';
  } catch {
    return 'light';
  }
}

export function resolveTheme(pref: ThemePreference): Theme {
  return pref === 'dark' ? 'dark' : 'light';
}

interface Props {
  children: ReactNode;
  profilePreference?: ThemePreference | null;
  onPersist?: (pref: ThemePreference) => void;
}

export function ThemeProvider({ children, profilePreference, onPersist }: Props) {
  const [preference, setPref] = useState<ThemePreference>(() => {
    if (profilePreference === 'dark') return 'dark';
    const stored = readStored();
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (profilePreference === 'dark') setPref('dark');
    else if (profilePreference === 'light') setPref('light');
  }, [profilePreference]);

  const theme: Theme = preference === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setPreference = useCallback(
    (pref: ThemePreference) => {
      setPref(pref);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, pref);
      } catch {
        /* storage unavailable */
      }
      onPersist?.(pref);
    },
    [onPersist],
  );

  const toggle = useCallback(() => setPreference(theme === 'dark' ? 'light' : 'dark'), [theme, setPreference]);

  const value = useMemo(() => ({ theme, preference, setPreference, toggle }), [theme, preference, setPreference, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
