// ============================================================
// MOCK DATA — Sistema Municipal de Albercas
// ============================================================

export const mockUsers = [
  {
    id: 'u001', name: 'Carlos Mendoza', email: 'carlos@municipio.mx',
    role: 'superadmin', nfcCard: 'NFC-SA-001', phone: '555-0001',
    membership: 'anual', status: 'activo', joinDate: '2024-01-15',
    avatar: null, services: ['Nado libre', 'Clases adultos']
  },
  {
    id: 'u002', name: 'María González', email: 'maria@municipio.mx',
    role: 'admin', nfcCard: 'NFC-AD-002', phone: '555-0002',
    membership: 'mensual', status: 'activo', joinDate: '2024-02-01',
    avatar: null, services: ['Administración']
  },
  {
    id: 'u003', name: 'Roberto Jiménez', email: 'roberto@municipio.mx',
    role: 'support', nfcCard: 'NFC-SP-003', phone: '555-0003',
    membership: null, status: 'activo', joinDate: '2024-03-10',
    avatar: null, services: ['Soporte técnico']
  },
  {
    id: 'u004', name: 'Ana Martínez', email: 'ana@alberca.mx',
    role: 'user', nfcCard: 'NFC-US-004', phone: '555-0004',
    membership: 'mensual', status: 'activo', joinDate: '2024-04-05',
    avatar: null, services: ['Nado libre', 'Aqua fitness']
  },
  {
    id: 'u005', name: 'Luis Hernández', email: 'luis@alberca.mx',
    role: 'user', nfcCard: 'NFC-US-005', phone: '555-0005',
    membership: 'diario', status: 'activo', joinDate: '2024-05-20',
    avatar: null, services: ['Nado libre']
  },
  {
    id: 'u006', name: 'Sofía Ramírez', email: 'sofia@alberca.mx',
    role: 'user', nfcCard: 'NFC-US-006', phone: '555-0006',
    membership: 'anual', status: 'inactivo', joinDate: '2023-11-10',
    avatar: null, services: ['Clases niños', 'Natación competitiva']
  },
  {
    id: 'u007', name: 'Diego Torres', email: 'diego@alberca.mx',
    role: 'user', nfcCard: 'NFC-US-007', phone: '555-0007',
    membership: 'mensual', status: 'activo', joinDate: '2024-06-01',
    avatar: null, services: ['Aqua fitness']
  },
  {
    id: 'u008', name: 'Valentina Cruz', email: 'valentina@alberca.mx',
    role: 'user', nfcCard: 'NFC-US-008', phone: '555-0008',
    membership: 'diario', status: 'activo', joinDate: '2024-07-15',
    avatar: null, services: ['Nado libre']
  },
];

export const mockAttendance = [
  { id: 'a001', userId: 'u004', userName: 'Ana Martínez', nfcCard: 'NFC-US-004', service: 'Nado libre', pool: 'Alberca Principal', date: '2024-07-15', time: '09:15', status: 'entrada' },
  { id: 'a002', userId: 'u005', userName: 'Luis Hernández', nfcCard: 'NFC-US-005', service: 'Nado libre', pool: 'Alberca Principal', date: '2024-07-15', time: '09:32', status: 'entrada' },
  { id: 'a003', userId: 'u007', userName: 'Diego Torres', nfcCard: 'NFC-US-007', service: 'Aqua fitness', pool: 'Alberca Recreativa', date: '2024-07-15', time: '10:00', status: 'entrada' },
  { id: 'a004', userId: 'u004', userName: 'Ana Martínez', nfcCard: 'NFC-US-004', service: 'Nado libre', pool: 'Alberca Principal', date: '2024-07-15', time: '11:05', status: 'salida' },
  { id: 'a005', userId: 'u008', userName: 'Valentina Cruz', nfcCard: 'NFC-US-008', service: 'Nado libre', pool: 'Alberca Principal', date: '2024-07-14', time: '08:45', status: 'entrada' },
  { id: 'a006', userId: 'u006', userName: 'Sofía Ramírez', nfcCard: 'NFC-US-006', service: 'Clases niños', pool: 'Alberca Infantil', date: '2024-07-14', time: '10:30', status: 'entrada' },
  { id: 'a007', userId: 'u005', userName: 'Luis Hernández', nfcCard: 'NFC-US-005', service: 'Nado libre', pool: 'Alberca Principal', date: '2024-07-13', time: '09:00', status: 'entrada' },
  { id: 'a008', userId: 'u007', userName: 'Diego Torres', nfcCard: 'NFC-US-007', service: 'Aqua fitness', pool: 'Alberca Recreativa', date: '2024-07-13', time: '10:00', status: 'entrada' },
  { id: 'a009', userId: 'u004', userName: 'Ana Martínez', nfcCard: 'NFC-US-004', service: 'Aqua fitness', pool: 'Alberca Recreativa', date: '2024-07-12', time: '09:15', status: 'entrada' },
  { id: 'a010', userId: 'u008', userName: 'Valentina Cruz', nfcCard: 'NFC-US-008', service: 'Nado libre', pool: 'Alberca Principal', date: '2024-07-12', time: '11:00', status: 'entrada' },
];

export const mockPayments = [
  { id: 'p001', userId: 'u004', userName: 'Ana Martínez', type: 'Membresía Mensual', amount: 350, date: '2024-07-01', method: 'Tarjeta', status: 'completado', reference: 'REF-2024-001' },
  { id: 'p002', userId: 'u005', userName: 'Luis Hernández', type: 'Entrada Diaria', amount: 50, date: '2024-07-15', method: 'Efectivo', status: 'completado', reference: 'REF-2024-002' },
  { id: 'p003', userId: 'u006', userName: 'Sofía Ramírez', type: 'Membresía Anual', amount: 3200, date: '2023-11-10', method: 'Transferencia', status: 'completado', reference: 'REF-2023-150' },
  { id: 'p004', userId: 'u007', userName: 'Diego Torres', type: 'Membresía Mensual', amount: 350, date: '2024-07-01', method: 'Tarjeta', status: 'completado', reference: 'REF-2024-003' },
  { id: 'p005', userId: 'u008', userName: 'Valentina Cruz', type: 'Entrada Diaria', amount: 50, date: '2024-07-14', method: 'Efectivo', status: 'completado', reference: 'REF-2024-004' },
  { id: 'p006', userId: 'u004', userName: 'Ana Martínez', type: 'Clase de Natación', amount: 200, date: '2024-07-10', method: 'Tarjeta', status: 'completado', reference: 'REF-2024-005' },
  { id: 'p007', userId: 'u005', userName: 'Luis Hernández', type: 'Entrada Diaria', amount: 50, date: '2024-07-13', method: 'Efectivo', status: 'completado', reference: 'REF-2024-006' },
  { id: 'p008', userId: 'u007', userName: 'Diego Torres', type: 'Taller Aqua Fitness', amount: 450, date: '2024-07-05', method: 'Transferencia', status: 'pendiente', reference: 'REF-2024-007' },
];

export const mockPaymentTypes = [
  { id: 'pt001', name: 'Entrada Diaria', price: 50, duration: '1 día', category: 'acceso', description: 'Acceso de un día a todas las albercas' },
  { id: 'pt002', name: 'Membresía Mensual', price: 350, duration: '30 días', category: 'membresía', description: 'Acceso ilimitado por mes' },
  { id: 'pt003', name: 'Membresía Anual', price: 3200, duration: '365 días', category: 'membresía', description: 'Acceso ilimitado por año con descuento' },
  { id: 'pt004', name: 'Clase de Natación', price: 200, duration: '4 sesiones', category: 'clase', description: 'Clases grupales de natación (4 sesiones)' },
  { id: 'pt005', name: 'Clases para Niños', price: 180, duration: '4 sesiones', category: 'clase', description: 'Natación infantil (4 sesiones)' },
  { id: 'pt006', name: 'Taller Aqua Fitness', price: 450, duration: '8 sesiones', category: 'taller', description: 'Ejercicio acuático de tonificación (8 sesiones)' },
  { id: 'pt007', name: 'Natación Competitiva', price: 600, duration: 'mensual', category: 'club', description: 'Entrenamiento competitivo mensual' },
];

export const mockSchedule = [
  { id: 's001', title: 'Nado Libre Adultos', pool: 'Alberca Principal', startTime: '06:00', endTime: '08:00', days: ['lun', 'mar', 'mié', 'jue', 'vie'], capacity: 40, instructor: null, category: 'acceso', color: '#3b82f6' },
  { id: 's002', title: 'Clases de Natación Infantil', pool: 'Alberca Infantil', startTime: '09:00', endTime: '10:00', days: ['lun', 'mié', 'vie'], capacity: 15, instructor: 'Prof. García', category: 'clase', color: '#10b981' },
  { id: 's003', title: 'Aqua Fitness', pool: 'Alberca Recreativa', startTime: '10:00', endTime: '11:00', days: ['mar', 'jue', 'sáb'], capacity: 20, instructor: 'Prof. López', category: 'taller', color: '#8b5cf6' },
  { id: 's004', title: 'Natación Competitiva', pool: 'Alberca Principal', startTime: '07:00', endTime: '09:00', days: ['lun', 'mié', 'vie'], capacity: 12, instructor: 'Prof. Ramos', category: 'club', color: '#f59e0b' },
  { id: 's005', title: 'Nado Libre General', pool: 'Alberca Principal', startTime: '16:00', endTime: '20:00', days: ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'], capacity: 50, instructor: null, category: 'acceso', color: '#3b82f6' },
  { id: 's006', title: 'Clases Adultos Mayores', pool: 'Alberca Recreativa', startTime: '11:00', endTime: '12:00', days: ['mar', 'jue'], capacity: 10, instructor: 'Prof. Morales', category: 'clase', color: '#10b981' },
];

export const mockEvents = [
  { id: 'e001', title: 'Torneo Municipal de Natación', date: '2024-08-10', time: '09:00', duration: '6 horas', pool: 'Alberca Principal', capacity: 100, registered: 78, status: 'próximo', description: 'Competencia abierta categorías infantil, juvenil y adultos.' },
  { id: 'e002', title: 'Exhibición de Clavados', date: '2024-08-20', time: '17:00', duration: '2 horas', pool: 'Alberca Principal', capacity: 200, registered: 45, status: 'próximo', description: 'Demostración de clavados artísticos por atletas seleccionados.' },
  { id: 'e003', title: 'Curso Intensivo Verano', date: '2024-07-22', time: '09:00', duration: '10 días', pool: 'Alberca Infantil', capacity: 30, registered: 30, status: 'lleno', description: 'Curso de natación intensivo para niños de 5 a 12 años.' },
  { id: 'e004', title: 'Festival del Agua 2024', date: '2024-09-15', time: '10:00', duration: '5 horas', pool: 'Todas', capacity: 500, registered: 120, status: 'próximo', description: 'Evento comunitario con actividades acuáticas para toda la familia.' },
];

export const mockRevenueByMonth = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  data: [18500, 21000, 19800, 24500, 28000, 32500, 38000, 0, 0, 0, 0, 0],
};

export const mockRevenueByCategory = {
  labels: ['Entradas Diarias', 'Membresías Mensuales', 'Membresías Anuales', 'Clases', 'Talleres', 'Clubes'],
  data: [12500, 45000, 38400, 28600, 18000, 9600],
};

export const mockAttendanceByHour = {
  labels: ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm'],
  data: [25, 45, 62, 48, 38, 30, 22, 18, 20, 28, 52, 65, 48, 32, 15],
};

export const mockAttendanceByDay = {
  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  data: [142, 128, 155, 130, 168, 210, 185],
};

export const mockStats = {
  totalUsers: 1247,
  activeUsers: 1089,
  todayAttendance: 143,
  monthlyRevenue: 38000,
  pendingPayments: 8,
  upcomingEvents: 4,
  poolsOperating: 3,
  averageOccupancy: 68,
};
