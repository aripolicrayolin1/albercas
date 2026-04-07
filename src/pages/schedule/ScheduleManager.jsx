import React, { useState } from 'react';
import { mockSchedule, mockEvents } from '../../data/mockData';
import { Plus, Clock, Users, MapPin, Edit, Trash2 } from 'lucide-react';

const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const CATEGORY_COLORS = {
  acceso: '#3b82f6',
  clase: '#10b981',
  taller: '#8b5cf6',
  club: '#f59e0b',
};

export default function ScheduleManager() {
  const [activeTab, setActiveTab] = useState('horarios');
  const [schedule] = useState(mockSchedule);
  const [events] = useState(mockEvents);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Horarios y Eventos</h1>
          <p className="page-subtitle">Gestión de programación de albercas y actividades</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" id="add-schedule-btn">
            <Plus size={16} /> {activeTab === 'horarios' ? 'Nueva Actividad' : 'Nuevo Evento'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${activeTab === 'horarios' ? ' active' : ''}`} onClick={() => setActiveTab('horarios')} id="tab-horarios">
          Horarios Regulares
        </button>
        <button className={`tab${activeTab === 'eventos' ? ' active' : ''}`} onClick={() => setActiveTab('eventos')} id="tab-eventos">
          Eventos Especiales
        </button>
        <button className={`tab${activeTab === 'calendario' ? ' active' : ''}`} onClick={() => setActiveTab('calendario')} id="tab-calendario">
          Vista Semanal
        </button>
      </div>

      {activeTab === 'horarios' && (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Alberca</th>
                  <th>Horario</th>
                  <th>Días</th>
                  <th>Capacidad</th>
                  <th>Instructor</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{s.pool}</td>
                    <td>
                      <span className="flex items-center gap-1" style={{ fontSize: 13 }}>
                        <Clock size={12} color="var(--color-text-muted)" />
                        {s.startTime} — {s.endTime}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                        {s.days.map(d => (
                          <span key={d} style={{
                            padding: '1px 5px', borderRadius: 4,
                            background: 'rgba(99,102,241,0.12)',
                            color: 'var(--color-primary)',
                            fontSize: 10, fontWeight: 700,
                          }}>{d}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1">
                        <Users size={12} color="var(--color-text-muted)" /> {s.capacity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{s.instructor || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: `${CATEGORY_COLORS[s.category]}22`, color: CATEGORY_COLORS[s.category] }}>
                        {s.category}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost" id={`edit-schedule-${s.id}`}><Edit size={14} /></button>
                        <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} id={`delete-schedule-${s.id}`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'eventos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {events.map(e => (
            <div key={e.id} className="card" style={{ position: 'relative' }}>
              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${e.status === 'lleno' ? 'badge-danger' : e.status === 'próximo' ? 'badge-primary' : 'badge-muted'}`}>
                  {e.status}
                </span>
                <div className="flex gap-2">
                  <button className="btn btn-ghost" id={`edit-event-${e.id}`}><Edit size={14} /></button>
                  <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} id={`delete-event-${e.id}`}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{e.title}</div>
              <div className="flex items-center gap-2 mb-2" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                📅 {e.date} · ⏰ {e.time} ({e.duration})
              </div>
              <div className="flex items-center gap-2 mb-3" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                <MapPin size={12} /> {e.pool}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                {e.description}
              </div>
              <div style={{ background: 'var(--color-base)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Inscritos</span>
                  <span style={{ fontWeight: 700 }}>{e.registered} / {e.capacity}</span>
                </div>
                <div style={{
                  marginTop: 6, height: 4, borderRadius: 99,
                  background: 'var(--color-border)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(e.registered / e.capacity) * 100}%`,
                    background: e.status === 'lleno' ? 'var(--color-danger)' : 'var(--color-primary)',
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'calendario' && (
        <div className="card">
          <div className="schedule-grid">
            {DAY_LABELS.map((day, i) => {
              const dayKey = DAYS[i];
              const dayActivities = schedule.filter(s => s.days.includes(dayKey));
              return (
                <div key={day}>
                  <div className="schedule-day-header">{day}</div>
                  {dayActivities.map(a => (
                    <div
                      key={a.id}
                      className="schedule-event"
                      style={{ background: a.color }}
                      id={`cal-event-${a.id}-${dayKey}`}
                    >
                      <div>{a.title}</div>
                      <div style={{ opacity: 0.85, fontSize: 10, marginTop: 1 }}>
                        {a.startTime} — {a.endTime}
                      </div>
                    </div>
                  ))}
                  {dayActivities.length === 0 && (
                    <div style={{
                      padding: 'var(--space-3)',
                      color: 'var(--color-text-muted)',
                      fontSize: 11,
                      textAlign: 'center',
                      border: '1px dashed var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}>Sin actividades</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
