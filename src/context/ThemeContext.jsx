import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_THEME = {
  colorBase: '#0f172a',
  colorSurface: '#1e293b',
  colorPrimary: '#6366f1',
  colorSecondary: '#22d3ee',
  colorAccent: '#f59e0b',
  colorSuccess: '#10b981',
  colorDanger: '#ef4444',
  colorText: '#f1f5f9',
  colorTextMuted: '#94a3b8',
  colorBorder: '#334155',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('app_theme');
    return stored ? JSON.parse(stored) : DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('app_theme', JSON.stringify(theme));
  }, [theme]);

  const applyTheme = (t) => {
    const root = document.documentElement;
    Object.entries(t).forEach(([key, value]) => {
      // Convert camelCase to --kebab-case
      const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(cssVar, value);
    });
  };

  const updateTheme = (updates) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
