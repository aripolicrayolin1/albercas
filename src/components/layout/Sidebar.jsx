import React, { useState } from 'react';
import {
  LayoutDashboard, Wifi, Users, Calendar, CreditCard,
  BarChart3, Brain, Palette, ClipboardList, HelpCircle,
  User, History, ChevronLeft, ChevronRight, Waves, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_MENUS, ROLE_LABELS, ROLE_COLORS } from '../../data/roles';

const ICON_MAP = {
  LayoutDashboard, Wifi, Users, Calendar, CreditCard,
  BarChart3, Brain, Palette, ClipboardList, HelpCircle,
  User, History,
};

export default function Sidebar({ 
  currentPath, 
  onNavigate, 
  collapsed, 
  onToggleCollapse,
  mobileOpen,
  onMobileClose 
}) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const menu = SIDEBAR_MENUS[user.role] || [];
  const roleColor = ROLE_COLORS[user.role] || 'var(--color-primary)';
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside 
      className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`} 
      role="navigation" 
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Waves size={20} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h2>Albercas</h2>
          <span>Sistema Municipal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && (
          <div className="sidebar-section-label">Navegación</div>
        )}
        {menu.map(item => {
          const IconComponent = ICON_MAP[item.icon];
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              className={`sidebar-link${isActive ? ' active' : ''}`}
              onClick={() => onNavigate(item.path)}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {IconComponent && <IconComponent className="sidebar-link-icon" size={18} />}
              <span className="sidebar-link-text">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${roleColor}, color-mix(in srgb, ${roleColor} 70%, #22d3ee))` }}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name truncate">{user.name}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={logout}
            title="Cerrar sesión"
            style={{ padding: '4px', minWidth: 28 }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        className="sidebar-collapse-btn"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expandir' : 'Colapsar'}
        aria-label={collapsed ? 'Expandir navegación' : 'Colapsar navegación'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
