import React, { useState } from 'react';
import { User, Mail, Phone, Shield, Key, Eye, EyeOff, Save, CheckCircle, AlertCircle, Camera, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { ROLE_LABELS, ROLE_COLORS } from '../../data/roles';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  // Password change state
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const showStatus = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: '', msg: '' }), 4000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`http://${window.location.hostname}:3001/api/users/${user.id}`, {
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email,
        role: user.role, // Maintain role
        status: user.status, // Maintain status
        membership: user.membership,
        nfc_card: user.nfcCard,
        services: user.services ? user.services.join(',') : '',
      });
      
      updateUser({ ...profileData });
      showStatus('success', '¡Perfil actualizado correctamente!');
    } catch (err) {
      showStatus('danger', err.response?.data?.error || 'Error al actualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      return showStatus('danger', 'Las contraseñas nuevas no coinciden.');
    }
    
    setLoading(true);
    try {
      await axios.put(`http://${window.location.hostname}:3001/api/users/${user.id}/change-password`, {
        currentPassword: passData.current,
        newPassword: passData.new
      });
      showStatus('success', '¡Contraseña actualizada con éxito!');
      setPassData({ current: '', new: '', confirm: '' });
    } catch (err) {
      showStatus('danger', err.response?.data?.error || 'Error al cambiar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const roleColor = ROLE_COLORS[user?.role] || 'var(--color-primary)';

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Gestiona tu información personal y configuración de seguridad</p>
        </div>
      </div>

      {status.msg && (
        <div className={`badge badge-${status.type} mb-4 shadow-sm animate-scale-in`} style={{ width: '100%', padding: 'var(--space-3)', justifyContent: 'center' }}>
          {status.type === 'success' ? <CheckCircle size={16} style={{marginRight:8}} /> : <AlertCircle size={16} style={{marginRight:8}} />}
          {status.msg}
        </div>
      )}

      <div className="grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* LEFT: Info & Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div style={{ position: 'relative', textAlign: 'center', padding: 'var(--space-6) 0' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColor}, var(--color-secondary))`,
                margin: '0 auto var(--space-4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, fontWeight: 800, color: 'white',
                boxShadow: `0 10px 25px -5px ${roleColor}44`,
                position: 'relative', border: '4px solid var(--color-base)'
              }}>
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                <button style={{
                  position: 'absolute', bottom: 5, right: 5,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--color-base)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--color-text-muted)'
                }} title="Cambiar foto">
                  <Camera size={16} />
                </button>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.name}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
                <span className="badge" style={{ background: `${roleColor}22`, color: roleColor, fontWeight: 700 }}>
                  {ROLE_LABELS[user?.role]}
                </span>
                <span className={`badge ${user?.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                  {user?.status}
                </span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 var(--space-4)' }} />
            
            <div style={{ padding: '0 var(--space-2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  <Shield size={16} /> Tarjeta NFC
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{user?.nfcCard || 'Sin asignar'}</div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  <CreditCard size={16} /> Membresía
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)' }}>{user?.membership || 'No activa'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title flex items-center gap-2 mb-6">
              <Key size={18} color="var(--color-primary)" /> Seguridad
            </div>
            <form onSubmit={handleUpdatePassword}>
              <div className="form-group mb-4">
                <label className="form-label">Contraseña Actual</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    required 
                    type={showPass ? 'text' : 'password'} 
                    className="form-input" 
                    value={passData.current} 
                    onChange={e => setPassData({...passData, current: e.target.value})} 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Nueva Contraseña</label>
                <input 
                  required 
                  type={showPass ? 'text' : 'password'} 
                  className="form-input" 
                  value={passData.new} 
                  onChange={e => setPassData({...passData, new: e.target.value})} 
                />
              </div>
              <div className="form-group mb-6">
                <label className="form-label">Confirmar Nueva Contraseña</label>
                <input 
                  required 
                  type={showPass ? 'text' : 'password'} 
                  className="form-input" 
                  value={passData.confirm} 
                  onChange={e => setPassData({...passData, confirm: e.target.value})} 
                />
              </div>
              <button type="submit" className="btn btn-secondary w-full" disabled={loading}>
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Form details */}
        <div className="card">
          <div className="card-title flex items-center gap-2 mb-8">
            <User size={18} color="var(--color-primary)" /> Datos Personales
          </div>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group mb-6">
              <label className="form-label">Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: 40 }} 
                  value={profileData.name} 
                  onChange={e => setProfileData({...profileData, name: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: 40 }} 
                  value={profileData.email} 
                  onChange={e => setProfileData({...profileData, email: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-group mb-8">
              <label className="form-label">Teléfono de Contacto</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="tel" 
                  className="form-input" 
                  style={{ paddingLeft: 40 }} 
                  value={profileData.phone} 
                  onChange={e => setProfileData({...profileData, phone: e.target.value})} 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full shadow-lg" style={{ height: 48 }} disabled={loading}>
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
          
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>
            <div style={{ color: 'var(--color-primary)', flexShrink: 0 }}>ℹ️</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Los cambios en tu nombre o correo electrónico podrían requerir una nueva validación por parte del administrador municipal para mantener la integridad de tu carnet NFC.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
