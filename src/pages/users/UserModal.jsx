import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { X, Save, Edit, User, Mail, CreditCard, Activity, Calendar, QrCode, Clock, Waves, Check } from 'lucide-react';
import { ROLE_LABELS } from '../../data/roles';

export default function UserModal({ user, mode, onClose, onSave, canEdit }) {
  const [formData, setFormData] = useState({ ...user });
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [qrLink, setQrLink] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [dbSchedules, setDbSchedules] = useState([]);
  const [dbEvents, setDbEvents] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  useEffect(() => {
    setFormData({ ...user });
    setQrLink(null);

    // Cargar horarios, eventos y enrollments actuales
    const fetchData = async () => {
      try {
        const hostname = window.location.hostname;
        const [sRes, eRes, enRes] = await Promise.all([
          axios.get(`http://${hostname}:3001/api/schedules`),
          axios.get(`http://${hostname}:3001/api/events`),
          axios.get(`http://${hostname}:3001/api/users/${user.id}/enrollments`)
        ]);
        setDbSchedules(sRes.data);
        setDbEvents(eRes.data);
        
        // Mapear enrollments actuales al formato {id, type}
        const currentEn = enRes.data.map(en => ({ id: en.activity_id, type: en.activity_type }));
        setSelectedActivities(currentEn);
      } catch (err) {
        console.error("Error al cargar datos en UserModal:", err);
      }
    };

    if (user.id) fetchData();
  }, [user]);

  const toggleActivity = (id, type) => {
    if (!isEditing) return;
    setSelectedActivities(prev => {
      const exists = prev.find(a => a.id === id && a.type === type);
      return exists 
        ? prev.filter(a => !(a.id === id && a.type === type))
        : [...prev, { id, type }];
    });
  };

  if (!user) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServicesChange = (e) => {
    const opts = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, services: opts }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;
    try {
      setSaving(true);
      
      // Derivar servicios legados para compatibilidad
      const derivedServices = selectedActivities.map(a => {
        const source = a.type === 'schedule' ? dbSchedules : dbEvents;
        return source.find(item => item.id === a.id)?.title;
      }).filter(Boolean);

      const finalData = {
        ...formData,
        services: derivedServices,
        selectedActivities
      };

      await onSave(user.id, finalData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    // Si estÃ¡bamos en modo ediciÃ³n, guardamos primero los cambios silenciosamente para que MP y la BD usen la nueva membresÃ­a
    if (isEditing) {
      setSaving(true);
      await onSave(user.id, formData);
      setSaving(false);
    }
    
    setGeneratingQr(true);
    try {
      const currentMembership = formData.membership || 'mensual';
      const price = currentMembership === 'anual' ? 3200 : (currentMembership === 'diario' ? 50 : 350);
      const res = await axios.post((import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + `/create-preference`, {
        title: `Renovación de Membresía ${currentMembership} - ${formData.name}`,
        price: price,
        quantity: 1,
        userId: user.id
      });
      setQrLink(res.data.init_point);
    } catch (err) {
      console.error(err);
      alert('Error generando link de renovación mp');
    } finally {
      setGeneratingQr(false);
    }
  };

  // ── PAYMENT POLLING ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!qrLink || !user.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get((import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + `/payments/check/${user.id}`);
        if (res.data && res.data.paid) {
          alert(`¡Pago completado! Se ha registrado exitosamente en la base de datos.`);
          clearInterval(interval);
          setQrLink(null);
          onClose(); // Cierra el modal porque ya terminó el flujo
        }
      } catch (err) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [qrLink, user.id, onClose]);

  const isViewOnly = !isEditing;

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-slide-up" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Editar Usuario' : 'Detalles del Usuario'}
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {isViewOnly && canEdit && (
              <button className="btn btn-ghost" onClick={() => setIsEditing(true)}>
                <Edit size={16} /> Editar
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label><User size={14} /> Nombre Completo</label>
              <input 
                className="form-input" name="name" 
                value={formData.name || ''} onChange={handleChange} 
                disabled={isViewOnly} required 
              />
            </div>
            
            <div className="form-group">
              <label><Mail size={14} /> Correo Electrónico</label>
              <input 
                className="form-input" name="email" type="email"
                value={formData.email || ''} onChange={handleChange} 
                disabled={isViewOnly} required 
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input 
                className="form-input" name="phone" 
                value={formData.phone || ''} onChange={handleChange} 
                disabled={isViewOnly} 
              />
            </div>

            <div className="form-group">
              <label>Rol</label>
              <select className="form-input" name="role" value={formData.role || 'usuario'} onChange={handleChange} disabled={isViewOnly}>
                 {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label><CreditCard size={14} /> Tarjeta NFC (Serial)</label>
              <input 
                className="form-input" name="nfcCard" 
                value={formData.nfcCard || ''} onChange={handleChange} 
                disabled={isViewOnly} placeholder="Ej: a9:b1:c4:33" 
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select className="form-input" name="status" value={formData.status || 'activo'} onChange={handleChange} disabled={isViewOnly}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="form-group">
              <label><Activity size={14} /> Tipo de Membresía</label>
              <select className="form-input" name="membership" value={formData.membership || ''} onChange={handleChange} disabled={isViewOnly}>
                <option value="">Ninguna</option>
                <option value="diario">Visita Diaria</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            <div className="form-group">
              <label><Calendar size={14} /> Fecha de Registro</label>
              <input 
                className="form-input" type="date"
                value={formData.joinDate || ''} disabled 
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: 'var(--space-6)', gridColumn: 'span 2' }}>
            <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
              <Waves size={16} color="var(--color-primary)" />
              <div style={{ fontWeight: 700, fontSize: 13 }}>Acceso a Clases y Eventos</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Clases Regulares</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {dbSchedules.map(sch => {
                  const active = selectedActivities.some(a => a.id === sch.id && a.type === 'schedule');
                  return (
                    <div 
                      key={sch.id}
                      onClick={() => toggleActivity(sch.id, 'schedule')}
                      style={{
                        padding: '10px', borderRadius: 8, cursor: isEditing ? 'pointer' : 'default',
                        border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: active ? 'var(--color-primary-glow)' : 'var(--color-base)',
                        opacity: !isEditing && !active ? 0.4 : 1,
                        fontSize: 12
                      }}
                    >
                      <div style={{ fontWeight: 700, color: active ? 'var(--color-primary)' : 'inherit' }}>{sch.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{sch.startTime} - {sch.endTime}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Eventos</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {dbEvents.map(evt => {
                  const active = selectedActivities.some(a => a.id === evt.id && a.type === 'event');
                  return (
                    <div 
                      key={evt.id}
                      onClick={() => toggleActivity(evt.id, 'event')}
                      style={{
                        padding: '10px', borderRadius: 8, cursor: isEditing ? 'pointer' : 'default',
                        border: active ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)',
                        background: active ? 'rgba(34,211,238,0.08)' : 'var(--color-base)',
                        opacity: !isEditing && !active ? 0.4 : 1,
                        fontSize: 12
                      }}
                    >
                      <div style={{ fontWeight: 700, color: active ? 'var(--color-secondary)' : 'inherit' }}>{evt.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{evt.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {qrLink && (
            <div style={{ marginTop: '1rem', background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Escanea para pagar la renovación</div>
              <div style={{ background: 'white', padding: 12, display: 'inline-block', borderRadius: 8 }}>
                <QRCodeSVG value={qrLink} size={150} level="M" />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                <a href={qrLink} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{qrLink}</a>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>Monto sugerido configurado. Actualización por polling automática.</div>
            </div>
          )}

          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }} className="flex gap-3 justify-end items-center">
             <button type="button" className="btn btn-secondary" style={{ marginRight: 'auto', background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onClick={handleRenew} disabled={generatingQr}>
                <QrCode size={16}/> {generatingQr ? 'Cargando...' : 'Cobrar Renovación'}
             </button>
             <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
             {isEditing && (
               <button type="submit" className="btn btn-primary" disabled={saving}>
                 {saving ? 'Guardando...' : <><Save size={16}/> Guardar Cambios</>}
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
}
