import React from 'react';
import { UserCheck, CreditCard, Calendar, Activity, Wifi, ClipboardList } from 'lucide-react';
import { mockStats, mockAttendance, mockPayments } from '../../data/mockData';

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
  return (
    <div className="animate-fade-in">
      <div className="stat-grid mb-6">
        <StatCard icon={UserCheck} label="Asistencia Hoy" value={mockStats.todayAttendance} change="+8% vs ayer" color="#10b981" bg="rgba(16,185,129,0.12)" />
        <StatCard icon={CreditCard} label="Ingresos del Mes" value={`$${mockStats.monthlyRevenue.toLocaleString()}`} change="+12%" color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <StatCard icon={Activity} label="Ocupación" value={`${mockStats.averageOccupancy}%`} color="#22d3ee" bg="rgba(34,211,238,0.12)" />
        <StatCard icon={Calendar} label="Eventos Próximos" value={mockStats.upcomingEvents} color="#8b5cf6" bg="rgba(139,92,246,0.12)" />
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Asistencia Reciente</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/attendance')}>Ver todo</button>
          </div>
          {mockAttendance.slice(0, 6).map(a => (
            <div key={a.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.userName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.pool} · {a.service}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${a.status === 'entrada' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{a.time}</div>
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
          {mockPayments.slice(0, 6).map(p => (
            <div key={p.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.userName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>${p.amount.toLocaleString()}</div>
                <span className={`badge ${p.status === 'completado' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: 2 }}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
