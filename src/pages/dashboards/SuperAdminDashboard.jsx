import React from 'react';
import {
  Users, UserCheck, CreditCard, TrendingUp,
  Calendar, Waves, AlertCircle, Activity
} from 'lucide-react';
import { mockStats, mockAttendance, mockPayments, mockRevenueByMonth } from '../../data/mockData';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip,
  Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(51,65,85,0.5)', drawBorder: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(51,65,85,0.5)', drawBorder: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
  },
};

function StatCard({ icon: Icon, label, value, change, color, bg }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && (
          <div className={`stat-change ${change.startsWith('+') ? 'up' : 'down'}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard({ onNavigate }) {
  const revenueData = {
    labels: mockRevenueByMonth.labels,
    datasets: [{
      data: mockRevenueByMonth.data,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#6366f1',
    }],
  };

  const recentAttendance = mockAttendance.slice(0, 5);
  const recentPayments = mockPayments.slice(0, 5);

  return (
    <div className="animate-fade-in">

      {/* Stats */}
      <div className="stat-grid mb-6">
        <StatCard
          icon={Users}
          label="Usuarios Registrados"
          value={mockStats.totalUsers.toLocaleString()}
          change="+12 este mes"
          color="#6366f1"
          bg="rgba(99,102,241,0.12)"
        />
        <StatCard
          icon={UserCheck}
          label="Asistencia Hoy"
          value={mockStats.todayAttendance}
          change="+8% vs ayer"
          color="#10b981"
          bg="rgba(16,185,129,0.12)"
        />
        <StatCard
          icon={CreditCard}
          label="Ingresos del Mes"
          value={`$${mockStats.monthlyRevenue.toLocaleString()}`}
          change="+12% vs mes ant."
          color="#f59e0b"
          bg="rgba(245,158,11,0.12)"
        />
        <StatCard
          icon={Activity}
          label="Ocupación Promedio"
          value={`${mockStats.averageOccupancy}%`}
          change="+5% este mes"
          color="#22d3ee"
          bg="rgba(34,211,238,0.12)"
        />
        <StatCard
          icon={Waves}
          label="Albercas Operando"
          value={mockStats.poolsOperating}
          color="#8b5cf6"
          bg="rgba(139,92,246,0.12)"
        />
        <StatCard
          icon={AlertCircle}
          label="Pagos Pendientes"
          value={mockStats.pendingPayments}
          color="#ef4444"
          bg="rgba(239,68,68,0.12)"
        />
        <StatCard
          icon={Calendar}
          label="Eventos Próximos"
          value={mockStats.upcomingEvents}
          color="#06b6d4"
          bg="rgba(6,182,212,0.12)"
        />
        <StatCard
          icon={TrendingUp}
          label="Usuarios Activos"
          value={mockStats.activeUsers.toLocaleString()}
          color="#10b981"
          bg="rgba(16,185,129,0.12)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-6" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Ingresos Mensuales</div>
              <div className="card-subtitle">Enero — Julio 2024</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/revenue')}>
              Ver todo
            </button>
          </div>
          <div className="chart-container">
            <Line data={revenueData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Asistencia Reciente</div>
              <div className="card-subtitle">Últimos registros NFC</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/attendance')}>
              Ver todo
            </button>
          </div>
          <div>
            {recentAttendance.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between"
                style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid rgba(51,65,85,0.5)' }}
              >
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: a.status === 'entrada' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: a.status === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)',
                    fontSize: 11,
                  }}>
                    {a.status === 'entrada' ? '↓' : '↑'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.service}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{a.time}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Últimos Pagos</div>
            <div className="card-subtitle">Transacciones recientes del sistema</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/payments')}>
              + Nuevo Pago
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/payments/history')}>
              Historial
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.userName}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{p.type}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    ${p.amount.toLocaleString()}
                  </td>
                  <td>{p.method}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{p.date}</td>
                  <td>
                    <span className={`badge ${p.status === 'completado' ? 'badge-success' : 'badge-warning'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
