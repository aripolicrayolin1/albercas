import React, { useState } from 'react';
import { Palette, RotateCcw, Check, Eye } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const COLOR_GROUPS = [
  {
    title: 'Superficie y Fondo',
    fields: [
      { key: 'colorBase', label: 'Fondo Base', description: 'Color principal del fondo de la aplicación' },
      { key: 'colorSurface', label: 'Superficie', description: 'Fondo de tarjetas, paneles y modales' },
      { key: 'colorBorder', label: 'Bordes', description: 'Líneas divisorias y bordes de componentes' },
    ]
  },
  {
    title: 'Identidad y Acentos',
    fields: [
      { key: 'colorPrimary', label: 'Primario', description: 'Botones principales y elementos destacados' },
      { key: 'colorSecondary', label: 'Secundario', description: 'Acentos y elementos complementarios' },
      { key: 'colorAccent', label: 'Destacado', description: 'Elementos de atención especial' },
    ]
  },
  {
    title: 'Estados y Feedback',
    fields: [
      { key: 'colorSuccess', label: 'Éxito', description: 'Confirmaciones y estados activos' },
      { key: 'colorDanger', label: 'Peligro', description: 'Errores y alertas críticas' },
    ]
  },
  {
    title: 'Tipografía',
    fields: [
      { key: 'colorText', label: 'Texto Principal', description: 'Color de lectura primario' },
      { key: 'colorTextMuted', label: 'Texto Secundario', description: 'Subtítulos y texto de apoyo' },
    ]
  }
];

const PRESETS = [
  {
    name: 'Nocturno Índigo',
    colors: {
      colorBase: '#0f172a', colorSurface: '#1e293b', colorPrimary: '#6366f1',
      colorSecondary: '#22d3ee', colorAccent: '#f59e0b', colorSuccess: '#10b981',
      colorDanger: '#ef4444', colorText: '#f1f5f9', colorTextMuted: '#94a3b8', colorBorder: '#334155',
    },
  },
  {
    name: 'Océano Profundo',
    colors: {
      colorBase: '#0c1826', colorSurface: '#132337', colorPrimary: '#0ea5e9',
      colorSecondary: '#06b6d4', colorAccent: '#f59e0b', colorSuccess: '#22c55e',
      colorDanger: '#ef4444', colorText: '#e2e8f0', colorTextMuted: '#94a3b8', colorBorder: '#1e3a5f',
    },
  },
  {
    name: 'Bosque Esmeralda',
    colors: {
      colorBase: '#0a1f0f', colorSurface: '#12301a', colorPrimary: '#10b981',
      colorSecondary: '#34d399', colorAccent: '#f59e0b', colorSuccess: '#84cc16',
      colorDanger: '#f87171', colorText: '#ecfdf5', colorTextMuted: '#6ee7b7', colorBorder: '#1a4d2e',
    },
  },
  {
    name: 'Amanecer Violeta',
    colors: {
      colorBase: '#150d27', colorSurface: '#241645', colorPrimary: '#a855f7',
      colorSecondary: '#ec4899', colorAccent: '#f59e0b', colorSuccess: '#10b981',
      colorDanger: '#ef4444', colorText: '#faf5ff', colorTextMuted: '#c4b5fd', colorBorder: '#3b2066',
    },
  },
];

export default function ColorSettings() {
  const { theme, updateTheme, resetTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  const handleColorChange = (key, value) => {
    updateTheme({ [key]: value });
  };

  const applyPreset = (preset) => {
    Object.entries(preset.colors).forEach(([k, v]) => updateTheme({ [k]: v }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración de Colores</h1>
          <p className="page-subtitle">Personaliza la paleta de colores de la aplicación en tiempo real</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={resetTheme} id="reset-colors-btn">
            <RotateCcw size={15} /> Restablecer
          </button>
          <button className="btn btn-primary" onClick={handleSave} id="save-colors-btn">
            {saved ? <><Check size={15} /> ¡Guardado!</> : <><Palette size={15} /> Guardar Tema</>}
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="card mb-6">
        <div className="card-title mb-4">Temas Predefinidos</div>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="btn btn-secondary"
              id={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                flexDirection: 'column',
                height: 'auto',
                padding: 'var(--space-4)',
                gap: 'var(--space-3)',
                minWidth: 140,
                alignItems: 'flex-start',
              }}
            >
              <div className="flex gap-1">
                {[preset.colors.colorPrimary, preset.colors.colorSecondary, preset.colors.colorAccent, preset.colors.colorSuccess].map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color pickers: Categorized */}
      <div className="grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
        {COLOR_GROUPS.map(group => (
          <div key={group.title} className="card">
            <div className="card-title mb-4" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
              {group.title}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {group.fields.map(field => (
                <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
                    <div 
                      style={{ 
                        width: '100%', height: '100%', borderRadius: 'var(--radius-md)', 
                        background: theme[field.key], border: '2px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)'
                      }} 
                    />
                    <input
                      type="color"
                      value={theme[field.key]}
                      onChange={e => handleColorChange(field.key, e.target.value)}
                      style={{
                        position: 'absolute', inset: 0,
                        opacity: 0, cursor: 'pointer', width: '100%', height: '100%',
                      }}
                      aria-label={field.label}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{field.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{field.description}</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, background: 'var(--color-base)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                    {theme[field.key].toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview panel */}
      <div className="card mt-6">
        <div className="card-title mb-4">
          <Eye size={16} style={{ display: 'inline', marginRight: 6 }} />
          Vista Previa de Componentes
        </div>
        <div className="flex gap-3 flex-wrap mb-4">
          <button className="btn btn-primary">Botón Primario</button>
          <button className="btn btn-secondary">Botón Secundario</button>
          <button className="btn btn-success">Botón Éxito</button>
          <button className="btn btn-danger">Botón Danger</button>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-danger">Danger</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-info">Info</span>
          <span className="badge badge-muted">Muted</span>
        </div>
        <div className="form-group" style={{ maxWidth: 300 }}>
          <label className="form-label">Campo de ejemplo</label>
          <input className="form-input" placeholder="Escribe algo aquí..." />
        </div>
      </div>
    </div>
  );
}
