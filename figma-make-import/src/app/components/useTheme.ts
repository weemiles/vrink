import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * TDS 다크모드 테마 컨텍스트
 *
 * - `.dark` 클래스를 <html>에 토글하여 CSS 변수를 전환합니다.
 * - localStorage에 설정을 저장합니다.
 * - system 모드는 `prefers-color-scheme`을 감지합니다.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'connection-theme-mode';

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  resolvedTheme: 'light',
  setMode: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

export function useThemeProvider() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(mode));

  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setResolvedTheme(resolved);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    applyTheme(resolveTheme(newMode));
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'light' ? 'dark' : 'light';
    setMode(next);
  }, [resolvedTheme, setMode]);

  // Apply on mount + listen for system changes
  useEffect(() => {
    applyTheme(resolveTheme(mode));

    if (mode === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [mode, applyTheme]);

  return {
    mode,
    resolvedTheme,
    setMode,
    toggleTheme,
  };
}
