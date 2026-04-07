import React from 'react';
import { Calendar, CreditCard, User, Waves, Star, Clock } from 'lucide-react';
import { mockPayments, mockSchedule, mockEvents } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export default function UserDashboard({ onNavigate }) {
  const { user } = useAuth();
  const myPayments = mockPayments.filter(p => p.userId === user?.id).slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Welcome banner */}
      <div className="card mb-6" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))',
        border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <div className="flex items-center gap-4">
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>¡Hola, {user?.name?.split(' ')[0]}! 👋</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
              Membresía <strong style={{ color: 'var(--color-primary)' }}>{user?.membership}</strong> · Tarjeta NFC: {user?.nfcCard}
            </div>
          </div>
          <span className={`badge ${user?.status === 'activo' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 12, padding: '4px 10px' }}>
            {user?.status}
          </span>
        </div>
      </div>

      <div className="grid-2 mb-6" style={{ gap: 'var(--space-4)' }}>
        {/* My services */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Mis Servicios</div>
          </div>
          {user?.services?.map((s, i) => (
            <div key={i} className="flex items-center gap-3" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Waves size={14} color="var(--color-primary)" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{s}</span>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm mt-4" onClick={() => onNavigate('/schedule')} style={{ width: '100%', justifyContent: 'center' }}>
            <Calendar size={14} /> Ver Horarios
          </button>
        </div>

        {/* My recent payments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Mis Pagos</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/payments/history')}>Ver todo</button>
          </div>
          {myPayments.length > 0 ? myPayments.map(p => (
            <div key={p.id} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.type}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.date}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>${p.amount.toLocaleString()}</div>
            </div>
          )) : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 'var(--space-4) 0' }}>
              No hay pagos registrados.
            </div>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Eventos Próximos</div>
        </div>
        <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
          {mockEvents.slice(0, 4).map(e => (
            <div key={e.id} style={{
              background: 'var(--color-base)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                📅 {e.date} · 🕘 {e.time}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {e.description.slice(0, 80)}...
              </div>
              <span className={`badge mt-4 ${e.status === 'lleno' ? 'badge-danger' : 'badge-primary'}`} style={{ marginTop: 8 }}>
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
