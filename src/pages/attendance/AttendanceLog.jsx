import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { mockAttendance } from '../../data/mockData';

export default function AttendanceLog() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPool, setFilterPool] = useState('all');

  const pools = ['all', 'Alberca Principal', 'Alberca Recreativa', 'Alberca Infantil'];

  const filtered = mockAttendance.filter(a => {
    const matchSearch = !search || a.userName.toLowerCase().includes(search.toLowerCase()) ||
      a.nfcCard.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchPool = filterPool === 'all' || a.pool === filterPool;
    return matchSearch && matchStatus && matchPool;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registro de Asistencia</h1>
          <p className="page-subtitle">Historial completo de accesos por NFC</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" id="export-attendance-btn">
            <Download size={15} /> Exportar
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="stat-grid mb-6">
        <div className="stat-card" style={{ '--stat-color': '#10b981', '--stat-bg': 'rgba(16,185,129,0.12)' }}>
          <div className="stat-icon" style={{ '--stat-color': '#10b981', '--stat-bg': 'rgba(16,185,129,0.12)' }}>↓</div>
          <div className="stat-info">
            <div className="stat-value">{mockAttendance.filter(a => a.status === 'entrada').length}</div>
            <div className="stat-label">Entradas</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#ef4444', '--stat-bg': 'rgba(239,68,68,0.12)' }}>
          <div className="stat-icon">↑</div>
          <div className="stat-info">
            <div className="stat-value">{mockAttendance.filter(a => a.status === 'salida').length}</div>
            <div className="stat-label">Salidas</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#6366f1', '--stat-bg': 'rgba(99,102,241,0.12)' }}>
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{new Set(mockAttendance.map(a => a.userId)).size}</div>
            <div className="stat-label">Usuarios únicos</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por nombre o tarjeta NFC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="attendance-search"
          />
        </div>
        <select
          className="form-input form-select"
          style={{ width: 160 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          id="attendance-filter-status"
        >
          <option value="all">Todos los estados</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
        </select>
        <select
          className="form-input form-select"
          style={{ width: 200 }}
          value={filterPool}
          onChange={e => setFilterPool(e.target.value)}
          id="attendance-filter-pool"
        >
          {pools.map(p => <option key={p} value={p}>{p === 'all' ? 'Todas las albercas' : p}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Tarjeta NFC</th>
                <th>Servicio</th>
                <th>Alberca</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>No se encontraron registros</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.userName}</td>
                  <td><span className="badge badge-info">{a.nfcCard}</span></td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{a.service}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{a.pool}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{a.date}</td>
                  <td style={{ fontWeight: 600 }}>{a.time}</td>
                  <td>
                    <span className={`badge ${a.status === 'entrada' ? 'badge-success' : 'badge-danger'}`}>
                      {a.status}
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
