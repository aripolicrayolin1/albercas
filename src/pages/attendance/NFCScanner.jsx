import React, { useState, useEffect } from 'react';
import {
  Wifi, WifiOff, CheckCircle, XCircle, Clock,
  Users, StopCircle, Play, AlertTriangle, Smartphone, Info,
} from 'lucide-react';
import { nfcService, setUserStore } from '../../services/nfcService';
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
          Escáner NFC — Requisitos del navegador
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          La API Web NFC requiere <strong>Chrome para Android</strong> (v89+) con NFC activado en el dispositivo.<br />
          Para probarlo desde tu teléfono, ejecuta <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>npm run dev -- --host</code> y accede a la IP de red del servidor.
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
          Cómo acceder desde tu teléfono Android:
        </div>
        {[
          'En el servidor, ejecuta: npm run dev -- --host',
          'Observa la IP de red que muestra Vite (ej. 192.168.1.x:5173)',
          'En Chrome Android, entra a esa URL',
          'Acepta el permiso de NFC cuando el navegador lo solicite',
          'Acerca la tarjeta al sensor NFC del teléfono',
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

  // Keep NFC service in sync with current user list
  useEffect(() => {
    setUserStore(users);
  }, [users]);

  // Cleanup on unmount
  useEffect(() => () => nfcService.stopScan(), []);

  const handleScan = (result) => {
    setLastScan(result);
    setError(null);
    setSessionLog(prev => [{ ...result, id: Date.now() }, ...prev].slice(0, 100));
    setSessionStats(prev => ({
      success: prev.success + (result.success ? 1 : 0),
      failed:  prev.failed  + (result.success ? 0 : 1),
    }));
  };

  const handleError = (msg) => {
    setError(msg);
    setScanning(false);
  };

  const startScanning = async () => {
    setError(null);
    setScanning(true);
    await nfcService.startScan(handleScan, handleError);
  };

  const stopScanning = () => {
    nfcService.stopScan();
    setScanning(false);
    setLastScan(null);
    setError(null);
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

      <div className="grid-2" style={{ gap: 'var(--space-4)' }}>

        {/* ── Left: Scanner visual ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-10)' }}>

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

              {/* NDEF records (if any data on card) */}
              {lastScan.rawRecords?.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-text-muted)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Datos NDEF en la tarjeta:
                  </div>
                  {lastScan.rawRecords.map((r, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '2px 6px', marginBottom: 2 }}>
                      [{r.recordType}] {r.decoded ?? '(binario)'}
                    </div>
                  ))}
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
