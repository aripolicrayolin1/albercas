import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, User, Droplets, Star, Clock, LogOut, Shield, Key, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function UserDashboard({ onNavigate }) {
  const { user, logout, updateUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for profile/security
  const [showConfig, setShowConfig] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '', avatar: user?.avatar || '' });
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '' });
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + ``;
        const [pRes, eRes, enRes] = await Promise.all([
          axios.get(`${API_URL}/payments`),
          axios.get(`${API_URL}/events`),
          axios.get(`${API_URL}/users/${user.id}/enrollments`)
        ]);

        setPayments(pRes.data.filter(p => p.user_id === user.id).slice(0, 3));
        setEvents(eRes.data.slice(0, 4));
        setEnrollments(enRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await axios.put((import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + `/users/${user.id}/profile`, profileData);
      updateUser(profileData);
      alert('Perfil actualizado exitosamente');
    } catch (err) {
      alert('Error al actualizar perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passData.new !== passData.confirm) {
      return setPassError('La nueva contraseña y su confirmación no coinciden.');
    }

    try {
      await axios.put((import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + `/users/${user.id}/change-password`, {
        currentPassword: passData.current,
        newPassword: passData.new
      });
      setPassSuccess('¡Contraseña actualizada exitosamente!');
      setPassData({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPassError(err.response?.data?.error || 'Error al actualizar contraseña.');
    }
  };

  const handleEnroll = async (activityId, activityType) => {
    try {
      await axios.post((import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + `/enroll`, {
        userId: user.id,
        activityId,
        activityType
      });
      alert('¡Inscripción exitosa!');
      const enRes = await axios.get((import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + `/users/${user.id}/enrollments`);
      setEnrollments(enRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al inscribirse');
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="loader mx-auto" style={{ width: 40, height: 40 }} /></div>;

  return (
    <div className="animate-fade-in relative">
      {/* Welcome banner */}
      <div className="card mb-6" style={{
        background: 'linear-gradient(135deg, rgba(74,13,20,0.05), rgba(176,141,68,0.05))',
        border: '1px solid var(--color-border)',
      }}>
        <div className="flex items-center gap-4">
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0,
            overflow: 'hidden'
          }}>
            {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>¡Hola, {user?.name?.split(' ')[0]}!</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
              Membresía <strong style={{ color: 'var(--color-primary)' }}>{user?.membership || 'No activa'}</strong> · Tel: {user?.phone || 'Sin número'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfig(true)}
              className="btn btn-secondary btn-sm"
              title="Configuración de Perfil"
            >
              <Shield size={16} /> Perfil
            </button>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Cerrar sesión"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showConfig && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content animate-slide-up" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Configuración de Mi Perfil</div>
              <button className="btn-icon" onClick={() => setShowConfig(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdateProfile} className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input
                    className="form-input" value={profileData.name}
                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    className="form-input" value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
              </div>
              <button className="btn btn-primary mt-4 w-full" type="submit" disabled={profileSaving}>
                {profileSaving ? 'Guardando...' : 'Actualizar Datos'}
              </button>
            </form>

            <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
              <div className="divider" style={{ margin: 'var(--space-4) 0' }} />
              <div className="flex items-center justify-between mb-4">
                <div style={{ fontWeight: 700, fontSize: 14 }}>Seguridad: Cambio de Contraseña</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPass(!showPass)}>
                  {showPass ? 'Cancelar' : 'Cambiar'}
                </button>
              </div>

              {showPass && (
                <form onSubmit={handleUpdatePassword} className="animate-fade-in">
                  <div className="form-group mb-3">
                    <label>Contraseña Actual</label>
                    <input
                      type="password" className="form-input" required
                      value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Nueva Contraseña</label>
                    <input
                      type="password" className="form-input" required
                      value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })}
                    />
                  </div>
                  <div className="form-group mb-4">
                    <label>Confirmar Nueva Contraseña</label>
                    <input
                      type="password" className="form-input" required
                      value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                    />
                  </div>

                  {passError && <div className="alert alert-danger mb-4">{passError}</div>}
                  {passSuccess && <div className="alert alert-success mb-4">{passSuccess}</div>}

                  <button className="btn btn-primary w-full" type="submit">Actualizar Contraseña</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid-2 mb-6" style={{ gap: 'var(--space-4)' }}>
        {/* My Services & Enrollments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Mis Inscripciones</div>
          </div>
          {enrollments.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 'var(--space-4) 0' }}>
              Aún no te has inscrito en ninguna actividad.
            </div>
          ) : enrollments.map((en, i) => (
            <div key={i} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div className="flex items-center gap-3">
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(99,102,241,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={14} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{en.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{en.time}</div>
                </div>
              </div>
              <span className="badge badge-success">Confirmado</span>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm mt-4" onClick={() => onNavigate('/schedule')} style={{ width: '100%', justifyContent: 'center' }}>
            <Calendar size={14} /> Explorar Horarios
          </button>
        </div>

        {/* My recent payments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Mis Pagos Recientes</div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/payments/history')}>Ver todo</button>
          </div>
          {payments.length > 0 ? payments.map((p, i) => (
            <div key={i} className="flex items-center justify-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.type}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.date}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>${Number(p.amount).toLocaleString()}</div>
            </div>
          )) : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 'var(--space-4) 0' }}>
              No hay pagos registrados.
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Explorar Eventos y Actividades</div>
        </div>
        <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
          {events.map(e => {
            const isEnrolled = enrollments.some(en => en.activity_id === e.id);
            return (
              <div key={e.id} style={{
                background: 'var(--color-base)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
                opacity: e.status === 'finalizado' ? 0.6 : 1
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{e.title}</div>
                <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  <Calendar size={12} /> {e.date} · <Clock size={12} /> {e.time}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                  {e.description.slice(0, 100)}...
                </div>
                <div className="flex items-center justify-between">
                  <span className={`badge ${e.registered >= e.capacity ? 'badge-danger' : 'badge-primary'}`}>
                    {e.registered >= e.capacity ? 'Lleno' : `${e.capacity - e.registered} lugares`}
                  </span>
                  {isEnrolled ? (
                    <div className="badge badge-success">Inscrito</div>
                  ) : e.status !== 'finalizado' && e.registered < e.capacity && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEnroll(e.id, 'event')}>Reservar lugar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
