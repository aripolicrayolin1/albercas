import React, { useState } from 'react';
import {
  LayoutDashboard, Wifi, Users, Calendar, CreditCard,
  BarChart3, Brain, Palette, ClipboardList, HelpCircle,
  User, History, ChevronLeft, ChevronRight, Waves, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_MENUS, ROLE_LABELS, ROLE_COLORS } from '../../data/roles';
import logoImg from '../../assets/logo-tulancingo.png';

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
      <div className="sidebar-logo" onClick={() => onNavigate('/')}>
        <img 
          src={logoImg} 
          alt="Tulancingo Logo" 
          className="sidebar-logo-img"
        />
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
              onClick={() => {
                onNavigate(item.path);
                if (mobileOpen) onMobileClose();
              }}
              title={collapsed ? item.label : ''}
              id={`nav-${item.path.substring(1) || 'dashboard'}`}
            >
              <div className="sidebar-link-icon">
                <IconComponent size={20} />
              </div>
              {!collapsed && <span className="sidebar-link-text">{item.label}</span>}
              {!collapsed && isActive && <div className="active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => onNavigate('/profile')} style={{ cursor: 'pointer' }}>
          <div 
            className="sidebar-user-avatar"
            style={{ background: `linear-gradient(135deg, ${roleColor}, var(--color-secondary))` }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name.split(' ')[0]}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
          )}
        </div>
        
        <button 
          className="sidebar-logout" 
          onClick={logout}
          title={collapsed ? "Cerrar Sesión" : ""}
          id="logout-btn"
        >
          <LogOut size={20} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>

        <button 
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          id="sidebar-toggle-btn"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
