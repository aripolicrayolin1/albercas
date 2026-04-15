import React, { useState } from 'react';
import { LayoutDashboard, Wifi, Calendar, Users, User, ShieldCheck } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

/* Items fijos de la barra inferior según rol */
const MOBILE_NAV = {
  superadmin: [
    { icon: LayoutDashboard, label: 'Panel',    path: '/dashboard' },
    { icon: Wifi,            label: 'NFC',      path: '/nfc',      nfc: true },
    { icon: Users,           label: 'Usuarios', path: '/users' },
    { icon: Calendar,        label: 'Horarios', path: '/schedule' },
    { icon: User,            label: 'Perfil',   path: '/profile' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Panel',    path: '/dashboard' },
    { icon: Wifi,            label: 'NFC',      path: '/nfc',      nfc: true },
    { icon: Users,           label: 'Usuarios', path: '/users' },
    { icon: Calendar,        label: 'Horarios', path: '/schedule' },
    { icon: User,            label: 'Perfil',   path: '/profile' },
  ],
  support: [
    { icon: LayoutDashboard, label: 'Panel',    path: '/dashboard' },
    { icon: Users,           label: 'Usuarios', path: '/users' },
    { icon: Calendar,        label: 'Horarios', path: '/schedule' },
    { icon: User,            label: 'Perfil',   path: '/profile' },
  ],
  user: [
    { icon: LayoutDashboard, label: 'Panel',    path: '/dashboard' },
    { icon: Calendar,        label: 'Horarios', path: '/schedule' },
    { icon: User,            label: 'Perfil',   path: '/profile' },
  ],
};

export default function DashboardLayout({
  currentPath,
  onNavigate,
  children,
  mobileSidebarOpen,
  toggleMobileSidebar,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const mobileItems = (user && MOBILE_NAV[user.role]) || MOBILE_NAV.user;

  return (
    <div className={`app-layout ${mobileSidebarOpen ? 'show-sidebar' : ''}`}>
      {/* Backdrop móvil */}
      <div className="sidebar-backdrop" onClick={toggleMobileSidebar} />

      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={toggleMobileSidebar}
      />

      <main className={`app-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Header
          currentPath={currentPath}
          sidebarCollapsed={collapsed}
          onToggleMobileMenu={toggleMobileSidebar}
          onNavigate={onNavigate}
        />
        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>

      {/* ── Barra de navegación inferior (solo móvil) ── */}
      <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
        <div className="mobile-bottom-nav-inner">
          {mobileItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPath === item.path ||
              (item.path !== '/dashboard' && currentPath.startsWith(item.path + '/'));
            return (
              <button
                key={item.path}
                className={`mobile-nav-item${isActive ? ' active' : ''}`}
                onClick={() => onNavigate(item.path)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="mobile-nav-icon">
                  {item.nfc ? (
                    <span className="mobile-nav-nfc">
                      <ShieldCheck size={20} />
                    </span>
                  ) : (
                    <Icon size={20} />
                  )}
                </span>
                {!item.nfc && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
