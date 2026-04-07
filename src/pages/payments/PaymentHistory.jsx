import React, { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { mockPayments } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export default function PaymentHistory() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');

  // Users only see their own payments
  const basePayments = user?.role === 'user'
    ? mockPayments.filter(p => p.userId === user.id)
    : mockPayments;

  const filtered = basePayments.filter(p => {
    const matchSearch = !search ||
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchMethod = filterMethod === 'all' || p.method === filterMethod;
    return matchSearch && matchStatus && matchMethod;
  });

  const totalAmount = filtered.reduce((s, p) => s + (p.status === 'completado' ? p.amount : 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Pagos</h1>
          <p className="page-subtitle">{filtered.length} transacciones · Total: ${totalAmount.toLocaleString()} MXN</p>
        </div>
        <button className="btn btn-secondary" id="export-payments-btn">
          <Download size={15} /> Exportar
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por usuario, concepto, referencia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="payment-history-search"
          />
        </div>
        <select
          className="form-input form-select"
          style={{ width: 160 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          id="payment-filter-status"
        >
          <option value="all">Todos los estados</option>
          <option value="completado">Completado</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <select
          className="form-input form-select"
          style={{ width: 160 }}
          value={filterMethod}
          onChange={e => setFilterMethod(e.target.value)}
          id="payment-filter-method"
        >
          <option value="all">Todos los métodos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {user?.role !== 'user' && <th>Usuario</th>}
                <th>Concepto</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    No se encontraron transacciones
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  {user?.role !== 'user' && <td style={{ fontWeight: 600 }}>{p.userName}</td>}
                  <td>{p.type}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: 15 }}>
                    ${p.amount.toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{p.method}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{p.date}</td>
                  <td>
                    <span className="badge badge-muted" style={{ fontFamily: 'monospace' }}>{p.reference}</span>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'completado' ? 'badge-success' : 'badge-warning'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
