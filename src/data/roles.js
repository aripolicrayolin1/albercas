import {
  LayoutDashboard, Wifi, Users, Calendar, CreditCard,
  BarChart3, Brain, Palette, Settings, ClipboardList,
  HelpCircle, User, History
} from 'lucide-react';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPPORT: 'support',
  USER: 'user',
};

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  support: 'Soporte',
  user: 'Usuario',
};

export const ROLE_COLORS = {
  superadmin: '#4a0d14', // Vino Tulancingo
  admin: '#6e1420',      // Vino medio
  support: '#b08d44',    // Dorado elegante
  user: '#78716c',       // Gris piedra premium
};

// Demo credentials for each role
export const DEMO_ACCOUNTS = [
  { email: 'carlos@municipio.mx', password: 'admin123', userId: 'u001', role: 'superadmin' },
  { email: 'maria@municipio.mx', password: 'admin123', userId: 'u002', role: 'admin' },
  { email: 'roberto@municipio.mx', password: 'admin123', userId: 'u003', role: 'support' },
  { email: 'ana@alberca.mx', password: 'user123', userId: 'u004', role: 'user' },
];

export const PERMISSIONS = {
  superadmin: {
    dashboard: true,
    nfcScanner: true,
    attendanceLog: true,
    userManagement: 'full',
    scheduleManagement: true,
    eventManagement: true,
    paymentProcessing: true,
    paymentHistory: true,
    paymentTypes: true,
    revenueOverview: true,
    revenueReports: true,
    aiAnalytics: true,
    colorSettings: true,
    roleManagement: true,
    ownProfile: true,
  },
  admin: {
    dashboard: true,
    nfcScanner: true,
    attendanceLog: true,
    userManagement: 'edit',
    scheduleManagement: true,
    eventManagement: true,
    paymentProcessing: true,
    paymentHistory: true,
    paymentTypes: false,
    revenueOverview: true,
    revenueReports: true,
    aiAnalytics: true,
    colorSettings: false,
    roleManagement: false,
    ownProfile: true,
  },
  support: {
    dashboard: true,
    nfcScanner: false,
    attendanceLog: true,
    userManagement: 'view',
    scheduleManagement: false,
    eventManagement: false,
    paymentProcessing: false,
    paymentHistory: false,
    paymentTypes: false,
    revenueOverview: false,
    revenueReports: false,
    aiAnalytics: false,
    colorSettings: false,
    roleManagement: false,
    ownProfile: true,
  },
  user: {
    dashboard: true,
    nfcScanner: false,
    attendanceLog: false,
    userManagement: false,
    scheduleManagement: false,
    eventManagement: false,
    paymentProcessing: false,
    paymentHistory: 'own',
    paymentTypes: false,
    revenueOverview: false,
    revenueReports: false,
    aiAnalytics: false,
    colorSettings: false,
    roleManagement: false,
    ownProfile: true,
  },
};

export const SIDEBAR_MENUS = {
  superadmin: [
    { label: 'Panel Principal', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Escáner NFC', path: '/nfc', icon: 'Wifi' },
    { label: 'Registro de Asistencia', path: '/attendance', icon: 'ClipboardList' },
    { label: 'Usuarios', path: '/users', icon: 'Users' },
    { label: 'Horarios', path: '/schedule', icon: 'Calendar' },
    { label: 'Pagos', path: '/payments', icon: 'CreditCard' },
    { label: 'Ingresos', path: '/revenue', icon: 'BarChart3' },
    { label: 'Analítica IA', path: '/analytics', icon: 'Brain' },
    { label: 'Configuración de Color', path: '/settings/colors', icon: 'Palette' },
    { label: 'Mi Perfil', path: '/profile', icon: 'User' },
  ],
  admin: [
    { label: 'Panel Principal', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Escáner NFC', path: '/nfc', icon: 'Wifi' },
    { label: 'Registro de Asistencia', path: '/attendance', icon: 'ClipboardList' },
    { label: 'Usuarios', path: '/users', icon: 'Users' },
    { label: 'Horarios', path: '/schedule', icon: 'Calendar' },
    { label: 'Pagos', path: '/payments', icon: 'CreditCard' },
    { label: 'Ingresos', path: '/revenue', icon: 'BarChart3' },
    { label: 'Analítica IA', path: '/analytics', icon: 'Brain' },
    { label: 'Mi Perfil', path: '/profile', icon: 'User' },
  ],
  support: [
    { label: 'Panel Principal', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Registro de Asistencia', path: '/attendance', icon: 'ClipboardList' },
    { label: 'Usuarios', path: '/users', icon: 'Users' },
    { label: 'Horarios', path: '/schedule', icon: 'Calendar' },
    { label: 'Ayuda', path: '/help', icon: 'HelpCircle' },
    { label: 'Mi Perfil', path: '/profile', icon: 'User' },
  ],
  user: [
    { label: 'Mi Panel', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Horarios', path: '/schedule', icon: 'Calendar' },
    { label: 'Mis Pagos', path: '/payments/history', icon: 'History' },
    { label: 'Mi Perfil', path: '/profile', icon: 'User' },
  ],
};
