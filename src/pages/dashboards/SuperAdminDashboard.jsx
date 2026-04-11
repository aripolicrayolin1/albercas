import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, UserCheck, CreditCard, TrendingUp,
  Calendar, Waves, AlertCircle, Activity
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip,
  Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const API_URL = `http://${window.location.hostname}:3001/api`;

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
    x: { grid: { color: 'rgba(51,65,85,0.2)', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: 'rgba(51,65,85,0.2)', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
  },
};

function StatCard({ icon: Icon, label, value, change, color, bg }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-icon"><Icon size={20} /></div>
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
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [sRes, cRes, aRes, pRes] = await Promise.all([
          axios.get(`${API_URL}/stats`),
          axios.get(`${API_URL}/stats/revenue-chart`),
          axios.get(`${API_URL}/attendance`), // Asumimos que reresamos el historial
          axios.get(`${API_URL}/payments`)
        ]);
        setStats(sRes.data);
        setChartData(cRes.data);
        setAttendance(aRes?.data?.slice(0, 5) || []);
        setPayments(pRes.data.slice(0, 5));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const revenueData = {
    labels: chartData.labels,
    datasets: [{
      data: chartData.data,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#6366f1',
    }],
  };

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="loader" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Stats */}
      <div className="stat-grid mb-6">
        <StatCard icon={Users} label="Usuarios Registrados" value={stats.totalUsers.toLocaleString()} change={stats.usersThisMonth > 0 ? `+${stats.usersThisMonth} este mes` : ''} color="#6366f1" bg="rgba(99,102,241,0.12)" />
        <StatCard icon={UserCheck} label="Asistencia Hoy" value={stats.todayAttendance} change={stats.attendanceChange} color="#10b981" bg="rgba(16,185,129,0.12)" />
        <StatCard icon={CreditCard} label="Ingresos del Mes" value={`$${stats.monthlyRevenue.toLocaleString()}`} change={stats.revenueChange} color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <StatCard icon={Activity} label="Ocupación Promedio" value={`${stats.averageOccupancy}%`} color="#22d3ee" bg="rgba(34,211,238,0.12)" />
        <StatCard icon={Waves} label="Albercas Operando" value={stats.poolsOperating} color="#8b5cf6" bg="rgba(139,92,246,0.12)" />
        <StatCard icon={AlertCircle} label="Pagos Pendientes" value={stats.pendingPayments} color="#ef4444" bg="rgba(239,68,68,0.12)" />
        <StatCard icon={Calendar} label="Eventos Próximos" value={stats.upcomingEvents} color="#06b6d4" bg="rgba(6,182,212,0.12)" />
        <StatCard icon={TrendingUp} label="Usuarios Activos" value={stats.activeUsers.toLocaleString()} color="#10b981" bg="rgba(16,185,129,0.12)" />
      </div>

      <div className="grid-2 mb-6" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Ingresos Mensuales</div>
              <div className="card-subtitle">Datos reales desde MySQL</div>
            </div>
          </div>
          <div className="chart-container-responsive">
            <div className="chart-container">
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Asistencia Reciente</div>
              <div className="card-subtitle">Últimos registros NFC</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/attendance')}>Ver todo</button>
          </div>
          <div>
            {attendance.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin registros hoy</div>
            ) : attendance.map((a, i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: a.status === 'entrada' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: a.status === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 11,
                  }}>
                    {a.status === 'entrada' ? '↓' : '↑'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.user_name || a.userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.service_name || a.service}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{a.scan_time || a.time}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.scan_date || a.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Últimos Pagos</div>
            <div className="card-subtitle">Transacciones reales del sistema</div>
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
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.user_name || p.userName}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{p.type}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>${p.amount.toLocaleString()}</td>
                  <td>{p.method}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{p.date}</td>
                  <td><span className={`badge ${p.status === 'completado' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
