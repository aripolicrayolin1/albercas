import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Wifi, WifiOff, CheckCircle, XCircle, Clock,
  Users, StopCircle, Play, AlertTriangle, Smartphone, Info, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { nfcService } from '../../services/nfcService';
import { useUsers } from '../../context/UserContext';

// ── Compatibility notice ──────────────────────────────────────────────────────
function CompatibilityBanner() {
  return (
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-5)',
    }}>
      <AlertTriangle size={18} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-accent)', marginBottom: 4 }}>
          Escáner NFC — Requisitos del navegador y Conexión Segura
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          <p>1. <strong>Contexto Seguro:</strong> La API Web NFC <em>solo</em> funciona en sitios seguros (<strong>HTTPS</strong>) o en <strong>localhost</strong>. Si accedes por IP local sin HTTPS, el navegador bloqueará el sensor.</p>
          <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: 6, fontSize: 11.5 }}>
            💡 <strong>Tip para pruebas:</strong> Usa <code style={{ color: 'var(--color-secondary)' }}>npm run dev -- --host</code> y asegúrate de que el teléfono esté en la misma red WiFi. Si no carga el NFC, prueba usando un túnel local o configura Chrome para tratar tu IP de red como segura.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Not supported UI ──────────────────────────────────────────────────────────
function NFCNotSupported() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--space-5)',
      }}>
        <WifiOff size={32} color="var(--color-danger)" />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
        Web NFC no disponible
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto var(--space-6)', lineHeight: 1.7 }}>
        Tu navegador actual no soporta la API Web NFC (<code>NDEFReader</code>).<br />
        Para usar el escáner físico necesitas:
      </div>
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 10,
        textAlign: 'left',
        background: 'var(--color-base)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        maxWidth: 360,
        margin: '0 auto',
      }}>
        {[
          { icon: Smartphone, text: 'Un teléfono Android con chip NFC' },
          { icon: Wifi, text: 'Chrome para Android, versión 89 o superior' },
          { icon: Info, text: 'NFC activado en Ajustes del dispositivo' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            <Icon size={16} color="var(--color-primary)" />
            {text}
          </div>
        ))}
      </div>

      {/* Access instructions */}
      <div style={{
        marginTop: 'var(--space-6)',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        maxWidth: 400,
        margin: 'var(--space-6) auto 0',
        textAlign: 'left',
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)', marginBottom: 10 }}>
          Pasos críticos para que funcione en móvil:
        </div>
        {[
          'Servidor: Ejecuta "npm run dev -- --host"',
          'Conectividad: Teléfono y PC deben estar en la MISMA red WiFi',
          'Seguridad: La Web NFC API requiere HTTPS o localhost. Si usas la IP local (192.x.x.x), Chrome puede marcarla como "No Segura" y DESACTIVAR el NFC automáticamente.',
          'Permiso: Chrome te pedirá permiso explícito "Permitir que el sitio use NFC". Si no aparece, verifica la configuración de seguridad del sitio en el navegador.',
          'Lectura: Acerca la tarjeta a la parte trasera (cerca de la cámara) de tu Android.',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3" style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 10, color: 'var(--color-primary)', flexShrink: 0,
            }}>{i + 1}</div>
            {step}
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 11, padding: '8px', border: '1px dashed var(--color-primary)', borderRadius: 6, color: 'var(--color-primary)' }}>
          ⚠️ <strong>Importante:</strong> Si el botón de "Activar Escáner" no aparece tras seguir estos pasos, es probable que el navegador haya bloqueado la API por falta de un certificado SSL válido.
        </div>
      </div>
    </div>
  );
}

// ── Main scanner ──────────────────────────────────────────────────────────────
export default function NFCScanner() {
  const { users } = useUsers();

  const [supported]   = useState(() => nfcService.isSupported());
  const [scanning, setScanning]         = useState(false);
  const [lastScan, setLastScan]         = useState(null);
  const [sessionLog, setSessionLog]     = useState([]);
  const [sessionStats, setSessionStats] = useState({ success: 0, failed: 0 });
  const [error, setError]               = useState(null);
  const [qrLink, setQrLink]             = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Configuration for current scan session
  const [scanConfig, setScanConfig] = useState({
    status: 'entrada',
    poolName: 'Alberca Principal',
    activityId: '',
    activityType: '',
    serviceName: 'Selecciona una actividad'
  });

  const pools = ['Alberca Principal', 'Alberca Recreativa', 'Alberca Infantil'];

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const [schedRes, evRes] = await Promise.all([
          axios.get(`http://${window.location.hostname}:3001/api/schedules`),
          axios.get(`http://${window.location.hostname}:3001/api/events`)
        ]);
        
        const all = [
          ...schedRes.data.map(s => ({ ...s, type: 'schedule', icon: '🗓️' })),
          ...evRes.data.map(e => ({ ...e, type: 'event', icon: '⭐' }))
        ];
        setActivities(all);
        if (all.length > 0) {
          setScanConfig(c => ({
            ...c, 
            activityId: all[0].id, 
            activityType: all[0].type,
            serviceName: all[0].title
          }));
        }
      } catch (err) {
        console.error('Error fetching activities for scanner:', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, []);

  // Cleanup on unmount
  useEffect(() => () => nfcService.stopScan(), []);

  const playTone = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch(e) {}
  };

  const handleScan = (result) => {
    setLastScan(result);
    setError(null);
    setQrLink(null);
    setSessionLog(prev => [{ ...result, id: Date.now() }, ...prev].slice(0, 100));
    setSessionStats(prev => ({
      success: prev.success + (result.success ? 1 : 0),
      failed:  prev.failed  + (result.success ? 0 : 1),
    }));
    playTone(result.success ? 'success' : 'error');
  };

  const handleExpressRenew = async () => {
    if (!lastScan || !lastScan.userId) return;
    setGeneratingQr(true);
    try {
      const price = lastScan.membership?.toLowerCase() === 'anual' ? 3200 : (lastScan.membership?.toLowerCase() === 'diario' ? 50 : 350);
      const API_URL = `http://${window.location.hostname}:3001/api`;
      const res = await axios.post(`${API_URL}/create-preference`, {
        title: `Renovación Exprés ${lastScan.membership || 'Mensual'} - ${lastScan.userName}`,
        price: price,
        quantity: 1,
        userId: lastScan.userId
      });
      setQrLink(res.data.init_point);
    } catch (err) {
      console.error(err);
      setError('Error generando QR de renovación');
    } finally {
      setGeneratingQr(false);
    }
  };

  // ── PAYMENT POLLING ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!qrLink || !lastScan || !lastScan.userId) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`http://${window.location.hostname}:3001/api/payments/check/${lastScan.userId}`);
        if (res.data && res.data.paid) {
          playTone('success');
          alert(`¡${lastScan.userName} ha pagado exitosamente! Por favor pídale que vuelva a acercar la tarjeta para ingresar en Verde.`);
          clearInterval(interval);
          setQrLink(null);
          setLastScan(null); // Reseteamos la lectura vencida
        }
      } catch (err) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [qrLink, lastScan]);

  const registerAttendance = async () => {
    if (!lastScan || !lastScan.success) return;
    try {
      const API_URL = `http://${window.location.hostname}:3001/api`;
      await axios.post(`${API_URL}/attendance`, {
        userId: lastScan.userId,
        userName: lastScan.userName,
        nfcCard: lastScan.nfcCard,
        serviceName: scanConfig.serviceName || lastScan.membership || 'Nado Libre',
        poolName: scanConfig.poolName || 'Alberca Principal',
        status: scanConfig.status
      });
      // Limpiar al terminar
      setLastScan(null);
      playTone('success');
    } catch(err) {
      console.error(err);
      setError('No se pudo registrar la entrada en la base de datos');
    }
  };

  const handleError = (msg) => {
    setError(msg);
    setScanning(false);
  };

  const startScanning = async () => {
    setError(null);
    setScanning(true);
    await nfcService.startScan(handleScan, handleError, scanConfig);
  };

  const stopScanning = () => {
    nfcService.stopScan();
    setScanning(false);
    setLastScan(null);
    setError(null);
    setQrLink(null);
  };

  const clearLog = () => {
    setSessionLog([]);
    setSessionStats({ success: 0, failed: 0 });
  };

  if (!supported) return <NFCNotSupported />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Escáner NFC</h1>
          <p className="page-subtitle">Control de acceso con tarjeta NFC física — Web NFC API</p>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            <Users size={13} style={{ display: 'inline', marginRight: 4 }} />
            {users.length} usuarios registrados
          </div>
          <button
            className={`btn btn-lg ${scanning ? 'btn-danger' : 'btn-primary'}`}
            onClick={scanning ? stopScanning : startScanning}
            id={scanning ? 'stop-scan-btn' : 'start-scan-btn'}
          >
            {scanning
              ? <><StopCircle size={18} /> Detener Escáner</>
              : <><Play size={18} /> Activar Escáner NFC</>}
          </button>
        </div>
      </div>

      <CompatibilityBanner />

      <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* ── Scan Configuration ── */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-4)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Configuración de Sesión</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Status Toggle */}
            <div style={{ display: 'flex', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', padding: 4 }}>
              <button
                style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: scanConfig.status === 'entrada' ? 'var(--color-primary)' : 'transparent', color: scanConfig.status === 'entrada' ? 'white' : 'var(--color-text-muted)' }}
                onClick={() => setScanConfig(c => ({...c, status: 'entrada'}))}
              >
                Entrada
              </button>
              <button
                style={{ flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: scanConfig.status === 'salida' ? 'var(--color-danger)' : 'transparent', color: scanConfig.status === 'salida' ? 'white' : 'var(--color-text-muted)' }}
                onClick={() => setScanConfig(c => ({...c, status: 'salida'}))}
              >
                Salida
              </button>
            </div>

            {/* Pool Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Alberca</label>
              <select
                className="input"
                style={{ height: 42, fontSize: 13 }}
                value={scanConfig.poolName}
                onChange={(e) => setScanConfig(c => ({...c, poolName: e.target.value}))}
              >
                {pools.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Activity Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Actividad / Clase</label>
              <select
                className="input"
                style={{ height: 42, fontSize: 13 }}
                value={`${scanConfig.activityId}|${scanConfig.activityType}`}
                onChange={(e) => {
                  const [id, type] = e.target.value.split('|');
                  const act = activities.find(a => a.id === id && a.type === type);
                  setScanConfig(c => ({
                    ...c, 
                    activityId: id, 
                    activityType: type,
                    serviceName: act?.title || '',
                    poolName: act?.pool || c.poolName
                  }));
                }}
              >
                {loadingActivities ? (
                  <option>Cargando actividades...</option>
                ) : (
                  activities.map(a => (
                    <option key={`${a.id}-${a.type}`} value={`${a.id}|${a.type}`}>
                      {a.icon} {a.title} ({a.type === 'schedule' ? 'Regular' : 'Evento'})
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.15)', padding: '8px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={12} /> Configura estos valores antes de activar el escáner.
            </div>
          </div>
        </div>

        {/* ── Scanner visual ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-10)', justifyContent: 'center' }}>

          {/* Animated rings */}
          <div className="nfc-scanner-ring" style={{ marginBottom: 'var(--space-6)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="nfc-ring" style={{
                borderColor: error
                  ? 'var(--color-danger)'
                  : scanning
                    ? (i === 2 ? 'var(--color-secondary)' : 'var(--color-primary)')
                    : 'var(--color-border)',
                animationPlayState: scanning ? 'running' : 'paused',
              }} />
            ))}
            <div className="nfc-core" style={{
              background: error
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : scanning
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                  : 'var(--color-surface-hover)',
            }}>
              {error
                ? <WifiOff size={32} color="white" />
                : <Wifi size={32} color={scanning ? 'white' : 'var(--color-text-muted)'} />}
            </div>
          </div>

          {/* Status label */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {error ? 'Error del escáner' : scanning ? 'Esperando tarjeta...' : 'Escáner Inactivo'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {error
                ? 'Revisa los permisos NFC del dispositivo'
                : scanning
                  ? 'Acerca la tarjeta NFC al sensor del dispositivo'
                  : 'Presiona "Activar Escáner NFC" para comenzar'}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              width: '100%',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
              fontSize: 13,
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Last scan result */}
          {lastScan && (
            <div style={{
              width: '100%',
              background: lastScan.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${lastScan.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              animation: 'slideUp 0.3s ease',
              marginBottom: 'var(--space-4)',
            }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                {lastScan.success
                  ? <CheckCircle size={24} color="var(--color-success)" />
                  : <XCircle size={24} color="var(--color-danger)" />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {lastScan.success ? '✓ Acceso Concedido' : '✗ Acceso Denegado'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {lastScan.scanTime} · {lastScan.scanDate}
                  </div>
                </div>
              </div>

              {/* User info */}
              <div className="flex items-center gap-3" style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                marginBottom: lastScan.errorMessage ? 'var(--space-3)' : 0,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: lastScan.success
                    ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                    : 'rgba(239,68,68,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 17, color: 'white', flexShrink: 0,
                }}>
                  {lastScan.photoInitials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{lastScan.userName}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastScan.nfcCard}
                  </div>
                  {lastScan.membership && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                      Membresía {lastScan.membership}
                    </div>
                  )}
                </div>
                <span className={`badge ${
                  lastScan.userStatus === 'activo'
                    ? 'badge-success'
                    : lastScan.userStatus === 'desconocido'
                      ? 'badge-danger'
                      : 'badge-warning'
                }`}>
                  {lastScan.userStatus}
                </span>
              </div>

              {/* Error/warning detail */}
              {lastScan.errorMessage && (
                <div style={{
                  fontSize: 12, color: lastScan.userStatus === 'desconocido' ? 'var(--color-danger)' : 'var(--color-accent)',
                  fontWeight: 500,
                  background: lastScan.userStatus === 'desconocido' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertTriangle size={12} />
                  {lastScan.errorMessage}
                </div>
              )}

              {lastScan.validationData && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: lastScan.validationData.statusIndicator === 'rojo' ? 'rgba(239,68,68,0.1)' : lastScan.validationData.statusIndicator === 'naranja' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `2px solid ${lastScan.validationData.statusIndicator === 'rojo' ? '#ef4444' : lastScan.validationData.statusIndicator === 'naranja' ? '#f59e0b' : '#10b981'}` }}>
                  <div style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', color: lastScan.validationData.statusIndicator === 'rojo' ? '#ef4444' : lastScan.validationData.statusIndicator === 'naranja' ? '#f59e0b' : '#10b981' }}>
                    {lastScan.validationData.daysRemaining === 0 ? 'MEMBRESÍA EXPIRADA' : `Vigencia: ${lastScan.validationData.daysRemaining} Días`}
                  </div>
                  <div style={{ fontSize: 12, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    {lastScan.validationData.lastPaymentDate ? `Último cobro: ${new Date(lastScan.validationData.lastPaymentDate).toLocaleDateString()}` : 'No presenta historial de pagos válidos'}
                  </div>
                </div>
              )}

              {lastScan.success ? (
                <button className="btn btn-primary" onClick={registerAttendance} style={{ width: '100%', marginTop: 'var(--space-4)', justifyContent: 'center' }}>
                  Autorizar y Registrar Asistencia ({scanConfig.status})
                </button>
              ) : (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  {qrLink ? (
                    <div style={{ background: 'var(--color-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Escanea para pagar la renovación</div>
                      <div style={{ background: 'white', padding: 12, display: 'inline-block', borderRadius: 8 }}>
                        <QRCodeSVG value={qrLink} size={140} level="M" />
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-primary)', wordBreak: 'break-all' }}>
                        <a href={qrLink} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{qrLink}</a>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>Esperando confirmación... Vuelve a escanear al terminar.</div>
                    </div>
                  ) : (
                    lastScan.userStatus !== 'desconocido' && lastScan.validationData?.daysRemaining === 0 ? (
                      <button className="btn" style={{ width: '100%', justifyContent: 'center', background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onClick={handleExpressRenew} disabled={generatingQr}>
                        <QrCode size={18} /> {generatingQr ? 'Generando...' : 'Volver a Pagar (Generar QR)'}
                      </button>
                    ) : (
                      <button className="btn btn-secondary" disabled style={{ width: '100%', justifyContent: 'center' }}>
                        Ingreso Bloqueado
                      </button>
                    )
                  )}
                </div>
              )}

            </div>
          )}

          {/* Session stats */}
          <div className="flex gap-4" style={{ width: '100%' }}>
            <div style={{
              flex: 1, textAlign: 'center', padding: 'var(--space-3)',
              background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-success)' }}>
                {sessionStats.success}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Accesos concedidos</div>
            </div>
            <div style={{
              flex: 1, textAlign: 'center', padding: 'var(--space-3)',
              background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-danger)' }}>
                {sessionStats.failed}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Accesos denegados</div>
            </div>
          </div>
        </div>

        {/* ── Right: Session log ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Registro de Sesión</div>
              <div className="card-subtitle">Lecturas NFC en tiempo real</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary">{sessionLog.length}</span>
              {sessionLog.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={clearLog} title="Limpiar log" style={{ fontSize: 11 }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {sessionLog.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                <div className="empty-state-icon">
                  <Clock size={22} />
                </div>
                <h3>Sin lecturas aún</h3>
                <p>Las tarjetas escaneadas aparecerán aquí en tiempo real.</p>
              </div>
            ) : sessionLog.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-2)',
                  borderBottom: '1px solid rgba(51,65,85,0.4)',
                  animation: i === 0 ? 'slideUp 0.25s ease' : undefined,
                }}
              >
                {s.success
                  ? <CheckCircle size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  : <XCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0 }} />}

                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: s.success
                    ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                    : 'rgba(239,68,68,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 11, color: s.success ? 'white' : 'var(--color-danger)',
                  flexShrink: 0,
                }}>
                  {s.photoInitials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.userName}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.nfcCard}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.success ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {s.success ? 'Concedido' : 'Denegado'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.scanTime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
