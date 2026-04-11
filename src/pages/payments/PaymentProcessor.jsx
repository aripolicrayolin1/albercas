import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { paymentService } from '../../services/paymentService';

export default function PaymentProcessor({ onNavigate }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [method, setMethod] = useState('Efectivo');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('proceso');
  const [users, setUsers] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [cashTendered, setCashTendered] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [txRef, setTxRef] = useState('');
  const [mpSuccess, setMpSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, typesRes] = await Promise.all([
          axios.get(`http://${window.location.hostname}:3001/api/users`),
          axios.get(`http://${window.location.hostname}:3001/api/payment-types`)
        ]);
        // Solo usuarios activos y excluyendo superadmin
        setUsers(usersRes.data.filter(u => u.status === 'activo' && u.role === 'user'));
        setPaymentTypes(typesRes.data);
      } catch (err) {
        console.error('Error cargando datos de pagos', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let interval;
    if (qrModalOpen && txRef) {
      interval = setInterval(async () => {
        try {
          const API_URL = `http://${window.location.hostname}:3001/api`;
          const res = await axios.get(`${API_URL}/payments/check-ref/${txRef}`);
          if (res.data.paid) {
            setQrModalOpen(false);
            setMpSuccess(true);
            const user = users.find(u => u.id === selectedUser);
            const successRes = await paymentService.processPayment({
              userId: user.id,
              userName: user.name,
              paymentTypeId: selectedType.id,
              paymentTypeName: selectedType.name,
              amount: selectedType.price,
              method: 'Mercado Pago (QR)',
            });
            setResult(successRes);
          }
        } catch (err) {
          console.error("Error en polling de MP:", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [qrModalOpen, txRef, users, selectedUser, selectedType]);

  const CATEGORY_ICONS = { acceso: '🏊', membresía: '⭐', clase: '📚', taller: '🏋️', club: '🏆' };

  const handleProcess = async () => {
    if (!selectedType || !selectedUser) return;
    const user = users.find(u => u.id === selectedUser);
    if (!user) return;

    setProcessing(true);
    setResult(null);
    setMpSuccess(false);

    let finalMethod = method;
    if (method === 'Transferencia' && transferRef) finalMethod = `Transferencia (${transferRef})`;
    
    if (method === 'Mercado Pago (QR)') {
      try {
        const uniqueRef = `TX-${Date.now()}-${user.id}`;
        setTxRef(uniqueRef);
        const API_URL = `http://${window.location.hostname}:3001/api`;
        const mpRes = await axios.post(`${API_URL}/create-preference`, {
          userId: user.id,
          title: selectedType.name,
          price: selectedType.price,
          quantity: 1,
          external_reference: uniqueRef
        });
        setQrLink(mpRes.data.init_point);
        setProcessing(false);
        setQrModalOpen(true);
      } catch(err) {
        setProcessing(false);
        setResult({ success: false, error: 'Error al generar código QR de Mercado Pago' });
      }
      return;
    }

    const res = await paymentService.processPayment({
      userId: user.id,
      userName: user.name,
      paymentTypeId: selectedType.id,
      paymentTypeName: selectedType.name,
      amount: selectedType.price,
      method: finalMethod,
    });

    setProcessing(false);
    setResult(res);
  };

  const handleReset = () => {
    setSelectedType(null);
    setSelectedUser('');
    setMethod('Efectivo');
    setCashTendered('');
    setTransferRef('');
    setMpSuccess(false);
    setResult(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Procesamiento de Pagos</h1>
          <p className="page-subtitle">Registro y cobro de servicios municipales</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('/payments/history')} id="view-payment-history-btn">
          Ver Historial
        </button>
      </div>

      <div className="tabs">
        <button className={`tab${activeTab === 'proceso' ? ' active' : ''}`} onClick={() => setActiveTab('proceso')} id="tab-proceso-pago">
          Nuevo Pago
        </button>
        <button className={`tab${activeTab === 'tipos' ? ' active' : ''}`} onClick={() => setActiveTab('tipos')} id="tab-tipos-pago">
          Tipos de Servicio
        </button>
      </div>

      {activeTab === 'proceso' && (
        <div className="grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
          {/* Left: Form */}
          <div>
            {/* Step 1: Select type */}
            <div className="card mb-4">
              <div className="card-title mb-4">1. Seleccionar Servicio</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {paymentTypes.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedType(pt)}
                    className="btn btn-secondary"
                    id={`select-payment-type-${pt.id}`}
                    style={{
                      flexDirection: 'column',
                      height: 'auto',
                      padding: 'var(--space-4)',
                      textAlign: 'left',
                      alignItems: 'flex-start',
                      border: selectedType?.id === pt.id
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      background: selectedType?.id === pt.id
                        ? 'var(--color-primary-glow)'
                        : 'var(--color-surface-hover)',
                    }}
                  >
                    <span style={{ fontSize: 20, marginBottom: 4 }}>{CATEGORY_ICONS[pt.category]}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{pt.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{pt.duration}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
                      ${pt.price.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select user */}
            <div className="card mb-4">
              <div className="card-title mb-4">2. Seleccionar Usuario</div>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <select
                  className="form-input form-select"
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  id="payment-user-select"
                >
                  <option value="">— Seleccionar usuario —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.nfcCard})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Payment method */}
            <div className="card mb-4">
              <div className="card-title mb-4">3. Método de Pago</div>
              <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
                {['Efectivo', 'Tarjeta', 'Transferencia', 'Mercado Pago (QR)'].map(m => (
                  <button
                    key={m}
                    onClick={() => {
                        setMethod(m);
                        setCashTendered('');
                        setTransferRef('');
                    }}
                    className="btn btn-secondary"
                    id={`payment-method-${m.toLowerCase().replace(/ /g, '-')}`}
                    style={{
                      flex: 1, minWidth: '45%',
                      justifyContent: 'center',
                      border: method === m ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: method === m ? 'var(--color-primary-glow)' : 'var(--color-surface-hover)',
                      color: method === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {m === 'Efectivo' ? '💵' : m === 'Tarjeta' ? '💳' : m === 'Transferencia' ? '🏦' : '📱'} {m}
                  </button>
                ))}
              </div>
              
              {/* Extra options logic */}
              {method === 'Efectivo' && (
                <div className="form-group animate-slide-up" style={{ marginTop: 12 }}>
                  <label className="form-label">Efectivo Recibido</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Cantidad $"
                      value={cashTendered}
                      onChange={e => setCashTendered(e.target.value)}
                    />
                    {cashTendered && selectedType && Number(cashTendered) >= selectedType.price && (
                      <div style={{ color: 'var(--color-success)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        Cambio: ${(Number(cashTendered) - selectedType.price).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {method === 'Transferencia' && (
                <div className="form-group animate-slide-up" style={{ marginTop: 12 }}>
                  <label className="form-label">Folio de Rastreo o Referencia</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. SPEI12345678"
                    value={transferRef}
                    onChange={e => setTransferRef(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary + Result */}
          <div>
            <div className="card mb-4">
              <div className="card-title mb-4">Resumen del Pago</div>
              {selectedType ? (
                <div>
                  <div className="flex items-center justify-between mb-3" style={{ padding: 'var(--space-3)', background: 'var(--color-base)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{selectedType.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{selectedType.duration}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)' }}>
                      ${selectedType.price.toLocaleString()}
                    </div>
                  </div>
                  {selectedUser && (
                    <div className="flex items-center gap-2 mb-3" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      👤 {users.find(u => u.id === selectedUser)?.name}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                    💳 {method}
                  </div>
                  <hr className="divider" />
                  <div className="flex items-center justify-between" style={{ fontSize: 18, fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-success)' }}>${selectedType.price.toLocaleString()} MXN</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 'var(--space-4) 0' }}>
                  Selecciona un servicio para ver el resumen.
                </div>
              )}

              <button
                className="btn btn-primary w-full mt-4"
                style={{ height: 46, fontSize: 15, justifyContent: 'center' }}
                onClick={handleProcess}
                disabled={!selectedType || !selectedUser || processing}
                id="process-payment-btn"
              >
                {processing ? (
                  <><Loader size={16} className="animate-spin" /> Procesando...</>
                ) : (
                  <><CreditCard size={16} /> {method === 'Mercado Pago (QR)' ? 'Generar Pago QR' : 'Procesar Pago'}</>
                )}
              </button>

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
                      Pídele al usuario que escanee este código para pagar con Mercado Pago. Se autorizará automáticamente.
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
                            setProcessing(false);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className="card animate-slide-up" style={{
                background: result.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                <div className="flex items-center gap-3 mb-4">
                  {result.success
                    ? <CheckCircle size={28} color="var(--color-success)" />
                    : <XCircle size={28} color="var(--color-danger)" />}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {result.success ? '¡Pago exitoso!' : 'Error en el pago'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {result.success ? result.transaction.reference : result.error}
                    </div>
                  </div>
                </div>
                {result.success && (
                  <button className="btn btn-secondary btn-sm" onClick={handleReset} style={{ width: '100%', justifyContent: 'center' }} id="new-payment-btn">
                    Nuevo Pago
                  </button>
                )}
                {!result.success && (
                  <button className="btn btn-danger btn-sm" onClick={() => setResult(null)} style={{ width: '100%', justifyContent: 'center' }} id="retry-payment-btn">
                    Reintentar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tipos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {paymentTypes.map(pt => (
            <div key={pt.id} className="card" style={{ position: 'relative' }}>
              <span style={{ fontSize: 28 }}>{CATEGORY_ICONS[pt.category]}</span>
              <div style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px' }}>{pt.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>{pt.description}</div>
              <div className="flex items-center justify-between">
                <span className="badge badge-muted">{pt.duration}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)' }}>
                  ${pt.price.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
