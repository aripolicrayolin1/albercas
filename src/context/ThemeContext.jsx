import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Versión de tema ──────────────────────────────────────────────────────────
const THEME_VERSION = '5-morena-vino-final';

// ─── Paleta Morena Institucional — Vino Profundo + Fondo Claro + Dorado ──────────
export const DEFAULT_THEME = {
  colorBase:       '#f8f4f2',   // Fondo hueso ligero institucional (limpio)
  colorSurface:    '#ffffff',   // Superficies blancas puras para tarjetas
  colorPrimary:    '#5d101d',   // Vino profundo (Identidad Institucional)
  colorSecondary:  '#c19434',   // Dorado sólido equilibrado
  colorAccent:     '#a0781c',   // Dorado oscuro para legibilidad
  colorSuccess:    '#16a34a',   
  colorDanger:     '#dc2626',   
  colorText:       '#1a0a0e',   // Texto casi negro para máximo contraste
  colorTextMuted:  '#6b5a5d',   // Gris guinda para texto secundario
  colorBorder:     '#e2d2d5',   // Borde sutil guinda/gris
};

// ─── Función para calcular variables derivadas ────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyTheme(t) {
  const root = document.documentElement;
  Object.entries(t).forEach(([key, value]) => {
    const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(cssVar, value);
  });

  // Variables derivadas para efectos visuales sin perder solidez
  root.style.setProperty('--color-primary-glow',   hexToRgba(t.colorPrimary, 0.15));
  root.style.setProperty('--color-surface-hover',  hexToRgba(t.colorPrimary, 0.04));
  root.style.setProperty('--color-surface-glass',  hexToRgba(t.colorSurface, 0.98));
  
  // Colores para el fondo decorativo del login (guinda y oro sutiles)
  root.style.setProperty('--login-glow-1', hexToRgba(t.colorPrimary,   0.08));
  root.style.setProperty('--login-glow-2', hexToRgba(t.colorSecondary, 0.05));
  root.style.setProperty('--login-glow-3', hexToRgba(t.colorAccent,    0.03));

  // Sidebar siempre guinda sólido (MAX contraste con blanco del contenido)
  root.style.setProperty('--sidebar-bg', t.colorPrimary);
  
  // Forzar color de tarjeta (evitar transparencia excesiva)
  root.style.setProperty('--color-surface-card', t.colorSurface);
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored  = localStorage.getItem('app_theme');
      const version = localStorage.getItem('app_theme_version');
      // Forzar actualización si la versión es distinta (para corregir errores previos de contraste)
      if (stored && version === THEME_VERSION) return JSON.parse(stored);
    } catch (_) {}
    return DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('app_theme', JSON.stringify(theme));
    localStorage.setItem('app_theme_version', THEME_VERSION);
  }, [theme]);

  const updateTheme = (updates) => setTheme(prev => ({ ...prev, ...updates }));

  const resetTheme = () => {
    localStorage.removeItem('app_theme');
    localStorage.removeItem('app_theme_version');
    setTheme(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, DEFAULT_THEME }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
