import React, { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import { mockPaymentTypes, mockUsers } from '../../data/mockData';
import { paymentService } from '../../services/paymentService';

export default function PaymentProcessor({ onNavigate }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [method, setMethod] = useState('Efectivo');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('proceso');

  const CATEGORY_ICONS = { acceso: '🏊', membresía: '⭐', clase: '📚', taller: '🏋️', club: '🏆' };

  const handleProcess = async () => {
    if (!selectedType || !selectedUser) return;
    const user = mockUsers.find(u => u.id === selectedUser);
    if (!user) return;

    setProcessing(true);
    setResult(null);

    const res = await paymentService.processPayment({
      userId: user.id,
      userName: user.name,
      paymentTypeId: selectedType.id,
      paymentTypeName: selectedType.name,
      amount: selectedType.price,
      method,
    });

    setProcessing(false);
    setResult(res);
  };

  const handleReset = () => {
    setSelectedType(null);
    setSelectedUser('');
    setMethod('Efectivo');
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
                {mockPaymentTypes.map(pt => (
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
                  {mockUsers.filter(u => u.role === 'user').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.nfcCard})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Payment method */}
            <div className="card mb-4">
              <div className="card-title mb-4">3. Método de Pago</div>
              <div className="flex gap-3">
                {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className="btn btn-secondary"
                    id={`payment-method-${m.toLowerCase()}`}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      border: method === m ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: method === m ? 'var(--color-primary-glow)' : 'var(--color-surface-hover)',
                      color: method === m ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {m === 'Efectivo' ? '💵' : m === 'Tarjeta' ? '💳' : '🏦'} {m}
                  </button>
                ))}
              </div>
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
                      👤 {mockUsers.find(u => u.id === selectedUser)?.name}
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
                  <><span className="loader" style={{ width: 16, height: 16 }} /> Procesando...</>
                ) : (
                  <><CreditCard size={16} /> Procesar Pago</>
                )}
              </button>
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
          {mockPaymentTypes.map(pt => (
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
