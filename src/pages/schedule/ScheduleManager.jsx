import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Clock, Users, MapPin, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const CATEGORY_COLORS = {
  acceso: '#3b82f6',
  clase: '#10b981',
  taller: '#8b5cf6',
  club: '#f59e0b',
};

const NUM_TO_DAY = { '1': 'lun', '2': 'mar', '3': 'mié', '4': 'jue', '5': 'vie', '6': 'sáb', '7': 'dom' };

export default function ScheduleManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('horarios');
  const [schedule, setSchedule] = useState([]);
  const [events, setEvents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialScheduleState = { id: '', title: '', pool: 'Alberca Principal', startTime: '06:00', endTime: '07:00', days: [], capacity: 20, instructor: '', category: 'acceso', color: '#3b82f6' };
  const initialEventState = { id: '', title: '', date: '', time: '10:00', duration: '2 horas', pool: 'Alberca Principal', capacity: 50, description: '', status: 'próximo' };
  
  const [scheduleForm, setScheduleForm] = useState(initialScheduleState);
  const [eventForm, setEventForm] = useState(initialEventState);
  
  // Enrollment view states
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const fetchData = async () => {
    try {
      const [schedRes, evRes, usersRes] = await Promise.all([
        axios.get(`http://${window.location.hostname}:3001/api/schedules`),
        axios.get(`http://${window.location.hostname}:3001/api/events`),
        axios.get(`http://${window.location.hostname}:3001/api/users`)
      ]);
      
      const mappedSchedules = schedRes.data.map(s => ({
        ...s,
        days: s.days.map(d => NUM_TO_DAY[d] || d)
      }));
      
      setSchedule(mappedSchedules);
      setEvents(evRes.data);
      
      // Filter roles != 'user'
      const filteredInstructors = usersRes.data.filter(u => u.status === 'activo' && u.role !== 'user');
      setInstructors(filteredInstructors);
    } catch (err) {
      console.error('Error fetching schedule data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteSchedule = async (id) => {
    if (window.confirm('¿Seguro que deseas borrar este horario?')) {
      await axios.delete(`http://${window.location.hostname}:3001/api/schedules/${id}`);
      fetchData();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('¿Seguro que deseas borrar este evento?')) {
      await axios.delete(`http://${window.location.hostname}:3001/api/events/${id}`);
      fetchData();
    }
  };

  const handleShowParticipants = async (activity) => {
    setSelectedActivity(activity);
    setShowParticipantsModal(true);
    setLoadingParticipants(true);
    try {
      const res = await axios.get(`http://${window.location.hostname}:3001/api/enrollments/${activity.id}`);
      setParticipants(res.data);
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Horarios y Eventos</h1>
          <p className="page-subtitle">Gestión de programación de albercas y actividades</p>
        </div>
        {['superadmin', 'admin', 'support'].includes(user?.role) && (
          <div className="page-actions">
            <button 
              className="btn btn-primary" 
              id="add-schedule-btn"
              onClick={() => {
                setIsEditing(false);
                if (activeTab === 'horarios') {
                  setScheduleForm(initialScheduleState);
                  setShowScheduleModal(true);
                } else {
                  setEventForm(initialEventState);
                  setShowEventModal(true);
                }
              }}
            >
              <Plus size={16} /> {activeTab === 'horarios' ? 'Nueva Actividad' : 'Nuevo Evento'}
            </button>
          </div>
        )}
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
                  {['superadmin', 'admin', 'support'].includes(user?.role) && <th>Acciones</th>}
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
                    {['superadmin', 'admin', 'support'].includes(user?.role) && (
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="badge badge-info" 
                            style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleShowParticipants(s)}
                          >
                            <Users size={12} /> Gestionar
                          </button>
                          <button className="btn btn-ghost" onClick={() => {
                            setIsEditing(true);
                            setScheduleForm({
                              ...s,
                              days: s.days.map(d => Object.keys(NUM_TO_DAY).find(key => NUM_TO_DAY[key] === d) || d)
                            });
                            setShowScheduleModal(true);
                          }} id={`edit-schedule-${s.id}`}><Edit size={14} /></button>
                          <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeleteSchedule(s.id)} id={`delete-schedule-${s.id}`}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'eventos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {events.map(e => {
            const isFull = e.registered >= e.capacity;
            const currentStatus = isFull ? 'lleno' : e.status;
            
            return (
            <div key={e.id} className="card" style={{ position: 'relative' }}>
              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${currentStatus === 'lleno' ? 'badge-danger' : currentStatus === 'próximo' ? 'badge-primary' : 'badge-muted'}`}>
                  {currentStatus}
                </span>
                {['superadmin', 'admin', 'support'].includes(user?.role) && (
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-ghost" 
                      title="Ver inscritos"
                      onClick={() => handleShowParticipants(e)}
                    >
                      <Users size={14} />
                    </button>
                    <button className="btn btn-ghost" onClick={() => {
                      setIsEditing(true);
                      setEventForm(e);
                      setShowEventModal(true);
                    }} id={`edit-event-${e.id}`}><Edit size={14} /></button>
                    <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeleteEvent(e.id)} id={`delete-event-${e.id}`}><Trash2 size={14} /></button>
                  </div>
                )}
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
                      width: `${Math.min(100, (e.registered / e.capacity) * 100)}%`,
                      background: isFull ? 'var(--color-danger)' : 'var(--color-primary)',
                      borderRadius: 99,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
                <button 
                  className="btn btn-secondary btn-sm mt-3" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleShowParticipants(e)}
                >
                  <Users size={14} /> Ver Inscritos
                </button>
              </div>
          )})}
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

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 550, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-title mb-4">{isEditing ? 'Editar Actividad' : 'Nueva Actividad'}</div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                ...scheduleForm,
                days: scheduleForm.days.map(d => NUM_TO_DAY[d] ? d : Object.keys(NUM_TO_DAY).find(key => NUM_TO_DAY[key] === d) || d),
                id: isEditing ? scheduleForm.id : `ACT-${Date.now()}`
              };
              try {
                if (isEditing) {
                  await axios.put(`http://${window.location.hostname}:3001/api/schedules/${payload.id}`, payload);
                } else {
                  await axios.post(`http://${window.location.hostname}:3001/api/schedules`, payload);
                }
                setShowScheduleModal(false);
                fetchData();
              } catch (err) { console.error(err); }
            }}>
              
              <div className="form-group mb-3">
                <label className="form-label">Título</label>
                <input required type="text" className="form-input" value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} />
              </div>

              <div className="grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Alberca</label>
                  <select className="form-input form-select" value={scheduleForm.pool} onChange={e => setScheduleForm({...scheduleForm, pool: e.target.value})}>
                    <option>Alberca Principal</option>
                    <option>Alberca Infantil</option>
                    <option>Alberca Recreativa</option>
                    <option>Todas</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-input form-select" value={scheduleForm.category} onChange={e => setScheduleForm({...scheduleForm, category: e.target.value, color: CATEGORY_COLORS[e.target.value] || '#3b82f6'})}>
                    <option value="acceso">Acceso</option>
                    <option value="clase">Clase</option>
                    <option value="taller">Taller</option>
                    <option value="club">Club</option>
                  </select>
                </div>
              </div>

              <div className="grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Hora de Inicio</label>
                  <input required type="time" className="form-input" value={scheduleForm.startTime} onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora de Fin</label>
                  <input required type="time" className="form-input" value={scheduleForm.endTime} onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})} />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Días de la semana</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {Object.keys(NUM_TO_DAY).map(num => {
                    const label = NUM_TO_DAY[num];
                    const isSelected = scheduleForm.days.includes(num) || scheduleForm.days.includes(label);
                    return (
                      <button 
                        key={num} type="button" 
                        onClick={() => {
                          const newDays = isSelected ? scheduleForm.days.filter(d => d !== num && d !== label) : [...scheduleForm.days, label];
                          setScheduleForm({...scheduleForm, days: newDays});
                        }}
                        style={{
                          height: 36, width: 36, borderRadius: '50%',
                          border: isSelected ? 'none' : '1px solid var(--color-border)',
                          background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                          color: isSelected ? 'white' : 'var(--color-text)',
                          fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {label.substring(0,2).toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Capacidad</label>
                  <input required type="number" className="form-input" value={scheduleForm.capacity} onChange={e => setScheduleForm({...scheduleForm, capacity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Instructor</label>
                  <select className="form-input form-select" value={scheduleForm.instructor} onChange={e => setScheduleForm({...scheduleForm, instructor: e.target.value})}>
                    <option value="">— Ninguno —</option>
                    {instructors.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role.toUpperCase()})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" className="btn btn-ghost" onClick={() => setShowScheduleModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 550, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-title mb-4">{isEditing ? 'Editar Evento' : 'Nuevo Evento'}</div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                ...eventForm,
                id: isEditing ? eventForm.id : `EV-${Date.now()}`
              };
              try {
                if (isEditing) {
                  await axios.put(`http://${window.location.hostname}:3001/api/events/${payload.id}`, payload);
                } else {
                  await axios.post(`http://${window.location.hostname}:3001/api/events`, payload);
                }
                setShowEventModal(false);
                fetchData();
              } catch (err) { console.error(err); }
            }}>
              
              <div className="form-group mb-3">
                <label className="form-label">Título del Evento</label>
                <input required type="text" className="form-input" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
              </div>

              <div className="grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input required type="date" className="form-input" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input required type="time" className="form-input" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} />
                </div>
              </div>

              <div className="grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Duración</label>
                  <input required type="text" className="form-input" placeholder="Ej. 2 horas" value={eventForm.duration} onChange={e => setEventForm({...eventForm, duration: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Alberca</label>
                  <select className="form-input form-select" value={eventForm.pool} onChange={e => setEventForm({...eventForm, pool: e.target.value})}>
                    <option>Alberca Principal</option>
                    <option>Alberca Infantil</option>
                    <option>Alberca Recreativa</option>
                    <option>Todas</option>
                  </select>
                </div>
              </div>

              <div className="grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Capacidad Máxima</label>
                  <input required type="number" className="form-input" value={eventForm.capacity} onChange={e => setEventForm({...eventForm, capacity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estatus</label>
                  <select className="form-input form-select" value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})}>
                    <option value="próximo">Próximo</option>
                    <option value="en curso">En Curso</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Descripción</label>
                <textarea required className="form-input" rows="3" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEventModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTICIPANTS MODAL */}
      {showParticipantsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="card-title">Inscritos en la Actividad</div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 14 }}>{selectedActivity?.title}</div>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowParticipantsModal(false)}>✕</button>
            </div>

            {loadingParticipants ? (
              <div className="p-8 text-center"><div className="loader mx-auto" /></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Fecha Inscripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                          Aún no hay personas inscritas en esta actividad.
                        </td>
                      </tr>
                    ) : participants.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{p.email}</td>
                        <td style={{ fontSize: 12 }}>{new Date(p.enrolled_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button className="btn btn-primary" onClick={() => setShowParticipantsModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
