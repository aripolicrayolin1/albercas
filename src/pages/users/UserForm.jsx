import React, { useState } from 'react';
import {
  ArrowLeft, CreditCard, Wifi, User, Mail, Phone,
  Shield, Waves, Check, AlertTriangle, Loader, RefreshCw,
} from 'lucide-react';
import { useUsers } from '../../context/UserContext';
import { nfcService } from '../../services/nfcService';
import { ROLE_LABELS, ROLE_COLORS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';

const AVAILABLE_SERVICES = [
  'Nado libre',
  'Clases adultos',
  'Clases niños',
  'Aqua fitness',
  'Natación competitiva',
  'Nado libre madrugada',
  'Taller de clavados',
];

const MEMBERSHIPS = [
  { value: 'diario',  label: 'Entrada Diaria',    price: '$50/día'     },
  { value: 'mensual', label: 'Membresía Mensual', price: '$350/mes'    },
  { value: 'anual',   label: 'Membresía Anual',   price: '$3,200/año'  },
];

// NFC capture states
const NFC_STATE = {
  IDLE:      'idle',       // waiting to start
  WAITING:   'waiting',   // reader active, waiting for card tap
  CAPTURED:  'captured',  // serial number read successfully
  ERROR:     'error',     // something went wrong
};

export default function UserForm({ onNavigate }) {
  const { users, addUser }      = useUsers();
  const { user: currentUser }   = useAuth();
  const nfcSupported            = nfcService.isSupported();

  const allowedRoles = currentUser?.role === 'superadmin'
    ? ['user', 'support', 'admin', 'superadmin']
    : ['user'];

  const [form, setForm] = useState({
    name:       '',
    email:      '',
    phone:      '',
    role:       'user',
    membership: 'mensual',
    status:     'activo',
    services:   ['Nado libre'],
    nfcCard:    '',         // will be filled by physical tap
  });

  const [errors,      setErrors]      = useState({});
  const [saved,       setSaved]       = useState(false);
  const [savedUser,   setSavedUser]   = useState(null);
  const [nfcState,    setNfcState]    = useState(NFC_STATE.IDLE);
  const [nfcError,    setNfcError]    = useState(null);
  const [manualMode,  setManualMode]  = useState(!nfcSupported);

  // ── helpers ──────────────────────────────────────────────────────────────
  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const toggleService = (svc) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(svc)
        ? f.services.filter(s => s !== svc)
        : [...f.services, svc],
    }));
  };

  // ── NFC capture ───────────────────────────────────────────────────────────
  const startNFCCapture = async () => {
    setNfcState(NFC_STATE.WAITING);
    setNfcError(null);

    try {
      const serial = await nfcService.readOneCard();

      // Check if this card is already registered to someone else
      const alreadyUsed = users.find(u =>
        u.nfcCard?.toLowerCase() === serial?.toLowerCase()
      );

      if (alreadyUsed) {
        setNfcState(NFC_STATE.ERROR);
        setNfcError(`Esta tarjeta ya está asignada a ${alreadyUsed.name}.`);
        return;
      }

      set('nfcCard', serial);
      setNfcState(NFC_STATE.CAPTURED);
    } catch (err) {
      setNfcState(NFC_STATE.ERROR);
      setNfcError(err.message ?? 'No se pudo leer la tarjeta NFC.');
    }
  };

  const resetNFC = () => {
    set('nfcCard', '');
    setNfcState(NFC_STATE.IDLE);
    setNfcError(null);
  };

  // ── validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name  = 'El nombre es requerido';
    if (!form.email.trim()) errs.email = 'El correo es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Correo inválido';
    if (users.some(u => u.email === form.email))
      errs.email = 'Este correo ya está registrado';
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido';
    if (!form.nfcCard.trim()) errs.nfcCard = 'Debes capturar o ingresar una tarjeta NFC';
    if (form.services.length === 0) errs.services = 'Selecciona al menos un servicio';
    return errs;
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const newUser = addUser({
      name:       form.name.trim(),
      email:      form.email.trim(),
      phone:      form.phone.trim(),
      role:       form.role,
      membership: form.membership,
      status:     form.status,
      services:   form.services,
      nfcCard:    form.nfcCard.trim(),
    });

    setSavedUser(newUser);
    setSaved(true);
  };

  // ── success screen ────────────────────────────────────────────────────────
  if (saved && savedUser) {
    const roleColor = ROLE_COLORS[savedUser.role] || 'var(--color-primary)';
    return (
      <div className="animate-slide-up" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-5)',
            animation: 'successBounce 0.5s ease',
          }}>
            <Check size={36} color="var(--color-success)" />
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>¡Usuario registrado!</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
            {savedUser.name} ha sido dado de alta exitosamente.
          </div>

          {/* Card */}
          <div style={{
            background: `linear-gradient(135deg, ${roleColor}22, rgba(34,211,238,0.1))`,
            border: `1px solid ${roleColor}44`,
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: 16, right: 16, opacity: 0.1 }}>
              <Waves size={48} color={roleColor} />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColor}, #22d3ee)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 18, color: 'white',
              }}>
                {savedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{savedUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{savedUser.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', textAlign: 'left' }}>
              {[
                { label: 'ID de Tarjeta NFC', value: savedUser.nfcCard, mono: true, highlight: true },
                { label: 'Membresía',          value: savedUser.membership },
                { label: 'Rol',                value: ROLE_LABELS[savedUser.role] },
                { label: 'Alta',               value: savedUser.joinDate },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    fontFamily: item.mono ? 'monospace' : undefined,
                    color: item.highlight ? roleColor : 'var(--color-text)',
                    wordBreak: 'break-all',
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-6)',
          }}>
            🔔 La tarjeta física ya está vinculada. El escáner NFC la reconocerá en cuanto sea detectada por el sensor.
          </div>

          <div className="flex gap-3" style={{ justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => onNavigate('/users')} id="back-to-users-btn">
              Ver usuarios
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate('/nfc')} id="go-to-nfc-btn">
              Ir al Escáner NFC
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NFC capture widget ────────────────────────────────────────────────────
  const NFCCaptureWidget = () => (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard size={16} color="var(--color-primary)" />
        <div className="card-title">Tarjeta NFC Física *</div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        {nfcSupported
          ? 'Usa el sensor NFC para capturar el número de serie único de la tarjeta física.'
          : 'Tu navegador no soporta Web NFC. Ingresa el ID de tarjeta manualmente.'}
      </div>

      {/* NFC not supported — manual input only */}
      {!nfcSupported && (
        <div className="form-group">
          <label className="form-label" htmlFor="manual-nfc">ID de tarjeta (manual)</label>
          <input
            id="manual-nfc"
            className="form-input"
            style={{ fontFamily: 'monospace', ...(errors.nfcCard ? { borderColor: 'var(--color-danger)' } : {}) }}
            placeholder="Ej. 04:a1:b2:c3:d4:e5 o NFC-US-001"
            value={form.nfcCard}
            onChange={e => set('nfcCard', e.target.value)}
          />
          {errors.nfcCard && (
            <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>{errors.nfcCard}</div>
          )}
        </div>
      )}

      {/* NFC supported — physical capture UI */}
      {nfcSupported && (
        <>
          {/* IDLE: prompt to start capture */}
          {nfcState === NFC_STATE.IDLE && (
            <button
              type="button"
              className="btn btn-primary w-full"
              style={{ height: 52, justifyContent: 'center', fontSize: 15 }}
              onClick={startNFCCapture}
              id="capture-nfc-btn"
            >
              <Wifi size={18} /> Acercar tarjeta al sensor NFC
            </button>
          )}

          {/* WAITING: pulse animation */}
          {nfcState === NFC_STATE.WAITING && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: 'var(--space-6)',
              background: 'rgba(99,102,241,0.06)',
              border: '2px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1s ease-in-out infinite',
                marginBottom: 12,
              }}>
                <Wifi size={26} color="white" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Esperando tarjeta...</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Acerca la tarjeta NFC al sensor del dispositivo
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 14 }}
                onClick={resetNFC}
                id="cancel-nfc-capture-btn"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* CAPTURED: show serial number */}
          {nfcState === NFC_STATE.CAPTURED && (
            <div style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
            }}>
              <div className="flex items-center gap-3">
                <CheckCircle size={24} color="var(--color-success)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-success)', marginBottom: 2 }}>
                    ✓ Tarjeta capturada
                  </div>
                  <div style={{
                    fontFamily: 'monospace', fontSize: 13, color: 'var(--color-text)',
                    background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '2px 8px',
                    display: 'inline-block', marginTop: 2, wordBreak: 'break-all',
                  }}>
                    {form.nfcCard}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={resetNFC}
                  title="Capturar otra tarjeta"
                  id="reset-nfc-btn"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {nfcState === NFC_STATE.ERROR && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
            }}>
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={20} color="var(--color-danger)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-danger)' }}>
                    Error al capturar la tarjeta
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {nfcError}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => { resetNFC(); startNFCCapture(); }}
                id="retry-nfc-btn"
              >
                Reintentar
              </button>
            </div>
          )}

          {errors.nfcCard && (
            <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 8 }}>
              {errors.nfcCard}
            </div>
          )}

          {/* Manual input toggle */}
          <button
            type="button"
            onClick={() => setManualMode(m => !m)}
            style={{
              marginTop: 10, fontSize: 12, color: 'var(--color-text-muted)',
              background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
            }}
            id="toggle-manual-nfc-btn"
          >
            {manualMode ? 'Usar sensor NFC' : 'Ingresar ID manualmente'}
          </button>

          {manualMode && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <input
                className="form-input"
                style={{ fontFamily: 'monospace' }}
                placeholder="ID de tarjeta (serie física)"
                value={form.nfcCard}
                onChange={e => { set('nfcCard', e.target.value); setNfcState(NFC_STATE.CAPTURED); }}
                id="manual-nfc-input"
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── form ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost" onClick={() => onNavigate('/users')} id="back-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Registrar Nuevo Usuario</h1>
            <p className="page-subtitle">Alta en el sistema + vinculación de tarjeta NFC física</p>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>

        {/* ── LEFT: form fields ── */}
        <form onSubmit={handleSubmit} noValidate id="user-registration-form">

          {/* Personal info */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-5">
              <User size={16} color="var(--color-primary)" />
              <div className="card-title">Información Personal</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Nombre Completo *</label>
              <input
                id="reg-name"
                className="form-input"
                style={errors.name ? { borderColor: 'var(--color-danger)' } : {}}
                placeholder="Ej. María García López"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
              {errors.name && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Correo Electrónico *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="reg-email"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 32, ...(errors.email ? { borderColor: 'var(--color-danger)' } : {}) }}
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </div>
                {errors.email && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>{errors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Teléfono *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: 32, ...(errors.phone ? { borderColor: 'var(--color-danger)' } : {}) }}
                    placeholder="555-0000"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>
                {errors.phone && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>{errors.phone}</div>}
              </div>
            </div>
          </div>

          {/* Role & membership */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={16} color="var(--color-primary)" />
              <div className="card-title">Rol y Membresía</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-role">Rol</label>
                <select id="reg-role" className="form-input form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                  {allowedRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-status">Estado</label>
                <select id="reg-status" className="form-input form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Membresía</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {MEMBERSHIPS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set('membership', m.value)}
                    id={`membership-${m.value}`}
                    style={{
                      padding: 'var(--space-3)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
                      border: form.membership === m.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: form.membership === m.value ? 'var(--color-primary-glow)' : 'var(--color-base)',
                      color: form.membership === m.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>{m.price}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-5">
              <Waves size={16} color="var(--color-primary)" />
              <div className="card-title">Servicios con acceso</div>
            </div>
            {errors.services && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 10 }}>{errors.services}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVAILABLE_SERVICES.map(svc => {
                const active = form.services.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => toggleService(svc)}
                    id={`service-${svc.replace(/\s/g, '-').toLowerCase()}`}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                      border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: active ? 'var(--color-primary-glow)' : 'var(--color-base)',
                      color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: active ? 700 : 500, fontSize: 13, transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {active && <Check size={12} />} {svc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* NFC capture */}
          <NFCCaptureWidget />

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('/users')} id="cancel-registration-btn">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', height: 44 }}
              id="submit-registration-btn"
            >
              <CreditCard size={16} /> Registrar Usuario
            </button>
          </div>
        </form>

        {/* ── RIGHT: preview ── */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={16} color="var(--color-primary)" />
              <div className="card-title">Vista Previa del Registro</div>
            </div>

            {/* Visual card */}
            <div style={{
              background: `linear-gradient(135deg, ${ROLE_COLORS[form.role] || 'var(--color-primary)'}33, rgba(34,211,238,0.15))`,
              border: `1px solid ${ROLE_COLORS[form.role] || 'var(--color-primary)'}44`,
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              marginBottom: 'var(--space-4)',
              position: 'relative', overflow: 'hidden', minHeight: 160,
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <Waves size={100} color={ROLE_COLORS[form.role] || 'var(--color-primary)'} />
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                Sistema Municipal de Albercas
              </div>

              <div style={{
                fontFamily: 'monospace', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
                color: form.nfcCard ? (ROLE_COLORS[form.role] || 'var(--color-primary)') : 'var(--color-text-muted)',
                marginBottom: 16, wordBreak: 'break-all', minHeight: 20,
              }}>
                {form.nfcCard || (
                  <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
                    {nfcSupported ? 'Acerca la tarjeta para capturar ID...' : 'ID pendiente...'}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Titular</div>
                  <div style={{ fontWeight: 700 }}>{form.name || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Membresía</div>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{form.membership}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Rol</div>
                  <div style={{ fontWeight: 700 }}>{ROLE_LABELS[form.role]}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Estado</div>
                  <span className={`badge ${form.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                    {form.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.7,
            }}>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>ℹ️ ¿Cómo funciona?</div>
              <p>El ID de tarjeta es el <strong>número de serie de hardware</strong> de la tarjeta NFC física (único por tarjeta).</p>
              <p style={{ marginTop: 6 }}>Al registrar, ese ID queda vinculado al usuario. Cuando acerquen la misma tarjeta al escáner, el sistema lo identificará al instante.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
