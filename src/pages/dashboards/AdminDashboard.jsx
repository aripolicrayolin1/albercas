import React, { useState, useEffect } from 'react';
import { UserCheck, CreditCard, Calendar, Activity, Wifi, ClipboardList } from 'lucide-react';
import axios from 'axios';

function StatCard({ icon: Icon, label, value, change, color, bg }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {change && <div className="stat-change up">{change}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + ``;
        const [statsRes, attendanceRes, paymentsRes] = await Promise.all([
          axios.get(`${API_URL}/stats`),
          axios.get(`${API_URL}/attendance`),
          axios.get(`${API_URL}/payments`)
        ]);
        setStats(statsRes.data);
        setAttendance(attendanceRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="loader" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="stat-grid mb-6">
        <StatCard icon={UserCheck} label="Asistencia Hoy" value={stats.todayAttendance} change="" color="#10b981" bg="rgba(16,185,129,0.12)" />
        <StatCard icon={CreditCard} label="Ingresos del Mes" value={`$${stats.monthlyRevenue.toLocaleString()}`} change="" color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <StatCard icon={Activity} label="Ocupación" value={`${stats.averageOccupancy}%`} color="#22d3ee" bg="rgba(34,211,238,0.12)" />
        <StatCard icon={Calendar} label="Eventos Próximos" value={stats.upcomingEvents} color="#8b5cf6" bg="rgba(139,92,246,0.12)" />
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Asistencia Reciente</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/attendance')}>Ver todo</button>
          </div>
          {attendance.length === 0 ? (
            <div style={{ padding: 'var(--space-4) 0', color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center' }}>
              Sin registros de asistencia hoy
            </div>
          ) : attendance.slice(0, 6).map((a, idx) => (
            <div key={idx} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.user_name || a.userName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.pool_name || a.pool} · {a.service_name || a.service}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${a.status === 'entrada' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{a.scan_time || a.time}</div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary btn-sm mt-4" onClick={() => onNavigate('/nfc')} style={{ width: '100%', justifyContent: 'center' }}>
            <Wifi size={14} /> Abrir Escáner NFC
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Pagos Recientes</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/payments/history')}>Ver todo</button>
          </div>
          {payments.length === 0 ? (
            <div style={{ padding: 'var(--space-4) 0', color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center' }}>
              Sin pagos recientes
            </div>
          ) : payments.slice(0, 6).map((p, idx) => (
            <div key={idx} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.user_name || p.userName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>${Number(p.amount).toLocaleString()}</div>
                <span className={`badge ${p.status === 'completado' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: 2 }}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
