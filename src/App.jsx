import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';

// Pages
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';

// Dashboards
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import AdminDashboard      from './pages/dashboards/AdminDashboard';
import UserDashboard       from './pages/dashboards/UserDashboard';
import SupportDashboard    from './pages/dashboards/SupportDashboard';

// Attendance
import NFCScanner    from './pages/attendance/NFCScanner';
import AttendanceLog from './pages/attendance/AttendanceLog';

// Users
import UserList from './pages/users/UserList';
import UserForm from './pages/users/UserForm';   // ← NEW

// Schedule
import ScheduleManager from './pages/schedule/ScheduleManager';

// Payments
import PaymentProcessor from './pages/payments/PaymentProcessor';
import PaymentHistory   from './pages/payments/PaymentHistory';

// Revenue
import RevenueOverview from './pages/revenue/RevenueOverview';

// Analytics
import AttendanceAnalytics from './pages/analytics/AttendanceAnalytics';

// Settings
import ColorSettings from './pages/settings/ColorSettings';

import './index.css';

// ── Inner router (has access to all contexts) ─────────────────────────────────
function AppRouter() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');

  const navigate = (path) => setCurrentPath(path);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-base)', flexDirection: 'column', gap: 16,
      }}>
        <div className="loader" style={{ width: 32, height: 32 }} />
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando sistema...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => setCurrentPath('/dashboard')} />;
  }

  const role = user.role;

  const renderPage = () => {
    // ── Dashboard ──────────────────────────────────────────────────────────
    if (currentPath === '/dashboard') {
      if (role === 'superadmin') return <SuperAdminDashboard onNavigate={navigate} />;
      if (role === 'admin')      return <AdminDashboard      onNavigate={navigate} />;
      if (role === 'support')    return <SupportDashboard    onNavigate={navigate} />;
      return                            <UserDashboard        onNavigate={navigate} />;
    }

    // ── NFC Scanner ────────────────────────────────────────────────────────
    if (currentPath === '/nfc') {
      if (['superadmin', 'admin'].includes(role)) return <NFCScanner />;
    }

    // ── Attendance Log ─────────────────────────────────────────────────────
    if (currentPath === '/attendance') {
      if (['superadmin', 'admin', 'support'].includes(role)) return <AttendanceLog />;
    }

    // ── Users — NEW FORM comes first so /users/new matches before /users ───
    if (currentPath === '/users/new') {
      if (['superadmin', 'admin'].includes(role))
        return <UserForm onNavigate={navigate} />;
    }

    if (currentPath === '/users' || currentPath.startsWith('/users')) {
      if (['superadmin', 'admin', 'support'].includes(role))
        return <UserList onNavigate={navigate} />;
    }

    // ── Schedule ───────────────────────────────────────────────────────────
    if (currentPath === '/schedule') return <ScheduleManager />;

    // ── Payments ───────────────────────────────────────────────────────────
    if (currentPath === '/payments') {
      if (['superadmin', 'admin'].includes(role))
        return <PaymentProcessor onNavigate={navigate} />;
    }

    if (currentPath === '/payments/history') return <PaymentHistory />;

    // ── Revenue ────────────────────────────────────────────────────────────
    if (currentPath === '/revenue') {
      if (['superadmin', 'admin'].includes(role))
        return <RevenueOverview onNavigate={navigate} />;
    }

    // ── AI Analytics ───────────────────────────────────────────────────────
    if (currentPath === '/analytics') {
      if (['superadmin', 'admin'].includes(role))
        return <AttendanceAnalytics />;
    }

    // ── Color Settings (superadmin only) ───────────────────────────────────
    if (currentPath === '/settings/colors') {
      if (role === 'superadmin') return <ColorSettings />;
    }

    // ── Fallback ───────────────────────────────────────────────────────────
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Página no encontrada</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
          No tienes permisos para acceder a esta sección, o la página no existe.
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Volver al Panel
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
      {renderPage()}
    </DashboardLayout>
  );
}

// ── Root: all providers wrap the router ──────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <AppRouter />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
