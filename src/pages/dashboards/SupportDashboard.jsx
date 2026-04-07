import React from 'react';
import { Users, ClipboardList, HelpCircle, Search } from 'lucide-react';
import { mockUsers, mockAttendance } from '../../data/mockData';

export default function SupportDashboard({ onNavigate }) {
  return (
    <div className="animate-fade-in">
      <div className="stat-grid mb-6">
        <div className="stat-card" style={{ '--stat-color': '#6366f1', '--stat-bg': 'rgba(99,102,241,0.12)' }}>
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{mockUsers.length}</div>
            <div className="stat-label">Usuarios en el sistema</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#10b981', '--stat-bg': 'rgba(16,185,129,0.12)' }}>
          <div className="stat-icon"><ClipboardList size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{mockAttendance.length}</div>
            <div className="stat-label">Registros de asistencia</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#f59e0b', '--stat-bg': 'rgba(245,158,11,0.12)' }}>
          <div className="stat-icon"><HelpCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">3</div>
            <div className="stat-label">Tickets abiertos</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Búsqueda de Usuarios</div>
          </div>
          <div className="search-box mb-4">
            <Search size={15} className="search-icon" />
            <input className="form-input" placeholder="Buscar por nombre, NFC, correo..." style={{ paddingLeft: 36 }} />
          </div>
          {mockUsers.slice(0, 5).map(u => (
            <div key={u.id} className="flex items-center gap-3" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0,
              }}>
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{u.nfcCard} · {u.email}</div>
              </div>
              <span className={`badge ${u.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm mt-4" onClick={() => onNavigate('/users')} style={{ width: '100%', justifyContent: 'center' }}>
            Ver todos los usuarios
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Asistencia Reciente</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/attendance')}>Ver todo</button>
          </div>
          {mockAttendance.slice(0, 6).map(a => (
            <div key={a.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.userName}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{a.pool}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${a.status === 'entrada' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
