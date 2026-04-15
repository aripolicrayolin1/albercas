import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, CreditCard, Wifi, User, Mail, Phone, Clock,
  Shield, Waves, Check, AlertTriangle, Loader, RefreshCw, CheckCircle, Key,
} from 'lucide-react';
import { useUsers } from '../../context/UserContext';
import { nfcService } from '../../services/nfcService';
import { ROLE_LABELS, ROLE_COLORS } from '../../data/roles';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';


const MEMBERSHIPS = [
  { value: 'diario',  label: 'Entrada Diaria',    price: '$50/día'     },
  { value: 'mensual', label: 'Membresía Mensual', price: '$350/mes'    },
  { value: 'anual',   label: 'Membresía Anual',   price: '$3,200/año'  },
];

// NFC capture states
// NFC capture states
const NFC_STATE = {
  IDLE:      'idle',       
  WAITING:   'waiting',   
  CAPTURED:  'captured',  
  ERROR:     'error',     
};

// ── NFC capture widget ────────────────────────────────────────────────────
const NFCCaptureWidget = ({ nfcSupported, nfcState, nfcError, manualMode, setManualMode, form, set, setNfcState, startNFCCapture, resetNFC }) => (
  <div className="card mb-4">
    <div className="flex items-center gap-2 mb-2">
      <CreditCard size={16} color="var(--color-primary)" />
      <div className="card-title">Tarjeta NFC Física *</div>
    </div>
    <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginBottom: 16 }}>
      {nfcSupported
        ? 'Usa el sensor NFC para capturar el número de serie único de la tarjeta física.'
        : 'Tu dispositivo no soporta lectura NFC nativa. Ingresa el ID manualmente.'}
    </div>

    {!manualMode && nfcSupported ? (
      <div style={{
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        border: '2px dashed var(--color-border)',
        textAlign: 'center',
        background: 'var(--color-base)',
      }}>
        {nfcState === 'idle' && (
          <button type="button" className="btn btn-primary" onClick={startNFCCapture}>
            <Wifi size={18} /> Iniciar Captura NFC
          </button>
        )}

        {nfcState === 'waiting' && (
          <div className="animate-pulse">
            <RefreshCw className="inline-block animate-spin mb-3" size={32} color="var(--color-primary)" />
            <div style={{ fontWeight: 600 }}>Esperando tarjeta...</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Acerca la tarjeta al sensor NFC ahora</div>
          </div>
        )}

        {nfcState === 'captured' && (
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
            }}>
              <CheckCircle size={24} color="var(--color-success)" />
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: 4 }}>ID Capturado</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--color-white)', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>
              {form.nfcCard}
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <button type="button" className="btn btn-secondary btn-sm" onClick={startNFCCapture}>Re-intentar</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetNFC}>Limpiar</button>
            </div>
          </div>
        )}

        {nfcState === 'error' && (
          <div>
            <AlertTriangle size={32} color="var(--color-danger)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-danger)', marginBottom: 8 }}>{nfcError}</div>
            <button type="button" className="btn btn-primary btn-sm" onClick={startNFCCapture}>Intentar de nuevo</button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManualMode(true)}>
            No tengo el sensor (Ingreso manual)
          </button>
        </div>
      </div>
    ) : (
      <div className="animate-fade-in">
        <div className="form-group">
          <label className="form-label">ID de Tarjeta (Manual)</label>
          <input
            type="text"
            className="form-input"
            style={{ fontFamily: 'monospace' }}
            placeholder="ID de tarjeta (serie física)"
            value={form.nfcCard}
            onChange={e => { set('nfcCard', e.target.value); setNfcState('captured'); }}
            id="manual-nfc-input"
          />
          {nfcSupported && (
            <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setManualMode(false)}>
              Volver al escáner NFC
            </button>
          )}
        </div>
      </div>
    )}
  </div>
);

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
    services:   [],         // Legacy
    selectedActivities: [], // New dynamic enrollment
    nfcCard:    '',         // will be filled by physical tap
  });

  const [errors,      setErrors]      = useState({});
  const [saved,       setSaved]       = useState(false);
  const [savedUser,   setSavedUser]   = useState(null);
  const [nfcState,    setNfcState]    = useState(NFC_STATE.IDLE);
  const [nfcError,    setNfcError]    = useState(null);
  const [manualMode,  setManualMode]  = useState(!nfcSupported);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [dbSchedules, setDbSchedules] = useState([]);
  const [dbEvents, setDbEvents] = useState([]);

  // Cargar horarios y eventos reales
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const hostname = window.location.hostname;
        const [sRes, eRes] = await Promise.all([
          axios.get(`http://${hostname}:3001/api/schedules`),
          axios.get(`http://${hostname}:3001/api/events`)
        ]);
        setDbSchedules(sRes.data);
        setDbEvents(eRes.data);
      } catch (err) {
        console.error("Error al cargar actividades para el registro:", err);
      }
    };
    fetchActivities();
  }, []);

  // Polling para Mercado Pago
  useEffect(() => {
    let interval;
    if (qrModalOpen && savedUser?.id) {
      interval = setInterval(async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + ``;
          const res = await axios.get(`${API_URL}/payments/check/${savedUser.id}`);
          if (res.data.paid) {
            setQrModalOpen(false);
            setSaved(true);
          }
        } catch (err) {
          console.error("Error en polling de MP:", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [qrModalOpen, savedUser?.id]);

  // ── helpers ──────────────────────────────────────────────────────────────
  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const toggleActivity = (id, type) => {
    setForm(f => {
      const exists = f.selectedActivities.find(a => a.id === id && a.type === type);
      const newActivities = exists
        ? f.selectedActivities.filter(a => !(a.id === id && a.type === type))
        : [...f.selectedActivities, { id, type }];
      
      return { ...f, selectedActivities: newActivities };
    });
    setErrors(e => ({ ...e, services: undefined }));
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
    const emailVal = form.email.trim();
    if (!emailVal) errs.email = 'El correo es requerido';
    else if (!emailVal.includes('@') || !emailVal.includes('.'))
      errs.email = 'Correo inválido';
    else if (users.some(u => u.email.toLowerCase() === emailVal.toLowerCase()))
      errs.email = 'Este correo ya está registrado';
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido';
    if (!form.nfcCard.trim()) errs.nfcCard = 'Debes capturar o ingresar una tarjeta NFC';
    if ((currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && form.selectedActivities.length === 0) errs.services = 'Selecciona al menos una clase o evento';
    return errs;
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      // Derivar servicios legados de las actividades seleccionadas para compatibilidad
      const derivedServices = form.selectedActivities.map(a => {
        const source = a.type === 'schedule' ? dbSchedules : dbEvents;
        return source.find(item => item.id === a.id)?.title;
      }).filter(Boolean);

      // 1. Guardar usuario en la DB
      const newUser = await addUser({
        name:       form.name.trim(),
        email:      form.email.trim(),
        phone:      form.phone.trim(),
        role:       form.role,
        membership: form.membership,
        status:     form.status,
        services:   derivedServices,
        selectedActivities: form.selectedActivities,
        nfcCard:    form.nfcCard.trim(),
      });

      // 2. Crear Preferencia de Mercado Pago
      setPaymentProcessing(true);
      
      const priceMap = { 'diario': 50, 'mensual': 350, 'anual': 3200 };
      const price = priceMap[form.membership] || 50;
      
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + ``;
      const mpRes = await axios.post(`${API_URL}/create-preference`, {
        userId: newUser.id,
        title: `Membresía ${form.membership.toUpperCase()} - Alberca Municipal`,
        price: price,
        quantity: 1
      });

      // 3. Mostrar Modal con QR
      setSavedUser(newUser);
      setQrLink(mpRes.data.init_point);
      setPaymentProcessing(false);
      setQrModalOpen(true);

    } catch (err) {
      setPaymentProcessing(false);
      setErrors({ nfcCard: 'Error al conectar con el servidor o crear el pago.' });
    }
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
                { label: 'Contraseña Temporal', value: savedUser.password, mono: true, highlight: true, isSecret: true },
                { label: 'Membresía',          value: savedUser.membership },
                { label: 'Rol',                value: ROLE_LABELS[savedUser.role] },
                { label: 'Alta',               value: savedUser.joinDate },
              ].map(item => (
                <div key={item.label} style={item.isSecret ? { gridColumn: 'span 2', background: 'rgba(245,158,11,0.1)', padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--color-warning)' } : {}}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                    {item.label} {item.isSecret && <Key size={10} style={{ display: 'inline', marginLeft: 4 }} />}
                  </div>
                  <div style={{
                    fontSize: item.isSecret ? 18 : 12, fontWeight: 700,
                    fontFamily: item.mono ? 'monospace' : undefined,
                    color: item.isSecret ? 'var(--color-warning)' : (item.highlight ? roleColor : 'var(--color-text)'),
                    wordBreak: 'break-all',
                  }}>
                    {item.value}
                  </div>
                  {item.isSecret && (
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      Copia esta clave y entrégala al usuario. No volverá a mostrarse.
                    </div>
                  )}
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
            <Bell size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> La tarjeta física ya está vinculada. El escáner NFC la reconocerá en cuanto sea detectada por el sensor.
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

            <div style={{
              marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99,102,241,0.1)', display: 'flex', gap: 12, alignItems: 'center'
            }}>
              <Key size={18} color="var(--color-primary)" />
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                <strong style={{ color: 'var(--color-primary)' }}>Seguridad:</strong> La contraseña de acceso se generará <strong>automáticamente</strong> al finalizar el registro.
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
          {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
            <div className="card mb-4" id="activities-selection-section">
              <div className="flex items-center gap-2 mb-5">
                <Waves size={16} color="var(--color-primary)" />
                <div className="card-title">Inscripción a Actividades</div>
              </div>

              {errors.services && <div style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 16 }}>{errors.services}</div>}

              {/* Clasificación de actividades */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Horarios Regulares (Clases)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {dbSchedules.length > 0 ? dbSchedules.map(sch => {
                    const active = form.selectedActivities.some(a => a.id === sch.id && a.type === 'schedule');
                    return (
                      <div 
                        key={sch.id}
                        onClick={() => toggleActivity(sch.id, 'schedule')}
                        style={{
                          padding: '12px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                          border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: active ? 'var(--color-primary-glow)' : 'var(--color-base)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex', flexDirection: 'column', gap: 4
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {sch.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {sch.startTime} - {sch.endTime}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Instr: {sch.instructor || '—'}
                        </div>
                      </div>
                    );
                  }) : <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Cargando horarios...</div>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Eventos Especiales
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {dbEvents.length > 0 ? dbEvents.map(evt => {
                    const active = form.selectedActivities.some(a => a.id === evt.id && a.type === 'event');
                    return (
                      <div 
                        key={evt.id}
                        onClick={() => toggleActivity(evt.id, 'event')}
                        style={{
                          padding: '12px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                          border: active ? '2px solid var(--color-secondary)' : '1px solid var(--color-border)',
                          background: active ? 'rgba(34,211,238,0.08)' : 'var(--color-base)',
                          transition: 'all 0.2s ease',
                          display: 'flex', flexDirection: 'column', gap: 4
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--color-secondary)' : 'var(--color-text)' }}>
                          {evt.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} /> {evt.date} · {evt.time}
                        </div>
                        <div style={{ fontSize: 10, alignSelf: 'flex-start' }}>
                          <span className="badge" style={{ padding: '2px 6px', fontSize: 9 }}>{evt.pool}</span>
                        </div>
                      </div>
                    );
                  }) : <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No hay eventos próximos.</div>}
                </div>
              </div>
            </div>
          )}

          {/* NFC capture */}
          <NFCCaptureWidget 
            nfcSupported={nfcSupported}
            nfcState={nfcState}
            nfcError={nfcError}
            manualMode={manualMode}
            setManualMode={setManualMode}
            form={form}
            set={set}
            setNfcState={setNfcState}
            startNFCCapture={startNFCCapture}
            resetNFC={resetNFC}
          />

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('/users')} id="cancel-registration-btn" disabled={paymentProcessing}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', height: 44 }}
              id="submit-registration-btn"
              disabled={paymentProcessing}
            >
              {paymentProcessing ? (
                <>
                  <Loader size={16} className="animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Generar Pago QR
                </>
              )}
            </button>
          </div>

          {/* QR Payment Modal */}
          {qrModalOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, animation: 'fade-in 0.3s ease'
            }}>
              <div style={{
                background: 'var(--color-surface)', padding: 'var(--space-8)',
                borderRadius: 'var(--radius-xl)', textAlign: 'center', border: '1px solid var(--color-border)',
                maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', width: '90%'
              }}>
                <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--color-text)' }}>Pago desde Celular</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
                  Pídele al usuario que escanee este código para pagar con Mercado Pago. La inscripción se activará automáticamente.
                </p>

                <div style={{
                  background: 'white', padding: 20, borderRadius: 16, display: 'inline-block',
                  border: '4px solid #009ee3', marginBottom: 20,
                  animation: 'pulse 2s infinite'
                }}>
                  <QRCodeSVG value={qrLink} size={200} />
                </div>
                
                <a 
                  href={qrLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'block', marginBottom: 24, fontSize: 13, color: 'var(--color-primary)', wordBreak: 'break-all', textDecoration: 'underline' }}
                >
                  {qrLink}
                </a>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 24 }}>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Esperando confirmación...</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                        setQrModalOpen(false);
                        setSaved(true);
                    }}
                  >
                    Saltar pago por ahora (Efectivo)
                  </button>
                </div>
              </div>
            </div>
          )}
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
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Actividades</div>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>
                    {form.selectedActivities.length > 0 
                      ? `${form.selectedActivities.length} seleccionada(s)` 
                      : 'Ninguna'}
                  </div>
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
