import React from 'react';
import { Bell, Search, Sun, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '../../data/roles';

const PAGE_TITLES = {
  '/dashboard': 'Panel Principal',
  '/nfc': 'Escáner NFC',
  '/attendance': 'Registro de Asistencia',
  '/users': 'Gestión de Usuarios',
  '/users/new': 'Nuevo Usuario',
  '/schedule': 'Horarios y Eventos',
  '/payments': 'Procesamiento de Pagos',
  '/payments/types': 'Tipos de Pago',
  '/payments/history': 'Historial de Pagos',
  '/revenue': 'Ingresos y Reportes',
  '/analytics': 'Analítica con IA',
  '/settings/colors': 'Configuración de Colores',
  '/profile': 'Mi Perfil',
  '/help': 'Centro de Ayuda',
};

export default function Header({ currentPath, sidebarCollapsed, onToggleMobileMenu, onNavigate }) {
  const { user } = useAuth();
  if (!user) return null;

  const title = PAGE_TITLES[currentPath] || 'Panel';
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const roleColor = ROLE_COLORS[user.role] || 'var(--color-primary)';
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header
      className={`app-header${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}
      role="banner"
    >
      <div className="header-left">
        <button 
          className="header-btn mobile-menu-btn" 
          onClick={onToggleMobileMenu}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="header-title">{title}</div>
          <div className="header-breadcrumb" style={{ fontSize: 11 }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="header-right">
        <button className="header-btn" title="Buscar" aria-label="Buscar">
          <Search size={16} />
        </button>
        <button className="header-btn" title="Notificaciones" aria-label="Notificaciones">
          <Bell size={16} />
          <span className="notif-badge" aria-hidden="true"></span>
        </button>

        <div 
          className="flex items-center gap-2" 
          style={{ marginLeft: 4, cursor: 'pointer', transition: 'opacity 0.2s' }}
          onClick={() => onNavigate('/profile')}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${roleColor}, var(--color-secondary))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
              {user.name.split(' ')[0]}
            </span>
            <span
              className={`badge`}
              style={{
                background: `${roleColor}22`,
                color: roleColor,
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 99,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 1,
              }}
            >
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
