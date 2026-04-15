import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, UserCheck, LogOut, Users, FileText, Table as TableIcon, FileDigit } from 'lucide-react';
import { exportService } from '../../services/exportService';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + ``;

export default function AttendanceLog() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPool, setFilterPool] = useState('all');
  const [showExportOptions, setShowExportOptions] = useState(false);

  const pools = ['all', 'Alberca Principal', 'Alberca Recreativa', 'Alberca Infantil'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/attendance`);
        setAttendance(res.data);
      } catch (err) {
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = attendance.filter(a => {
    const user_name = a.user_name || a.userName || '';
    const nfc_card = a.nfc_card || a.nfcCard || '';
    const matchSearch = !search || user_name.toLowerCase().includes(search.toLowerCase()) ||
      nfc_card.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchPool = filterPool === 'all' || (a.pool_name || a.pool) === filterPool;
    return matchSearch && matchStatus && matchPool;
  });

  // -- EXPORTS --
  const handleExportPDF = () => {
    const title = 'Reporte de Asistencia — Sistema Municipal';
    const columns = [
      { header: 'Usuario', dataKey: 'usuario' },
      { header: 'NFC', dataKey: 'nfc' },
      { header: 'Servicio', dataKey: 'servicio' },
      { header: 'Alberca', dataKey: 'alberca' },
      { header: 'Fecha', dataKey: 'fecha' },
      { header: 'Hora', dataKey: 'hora' },
      { header: 'Estado', dataKey: 'estado' },
    ];
    const data = filtered.map(a => ({
      usuario: a.user_name || a.userName,
      nfc: a.nfc_card || a.nfcCard,
      servicio: a.service_name || a.service,
      alberca: a.pool_name || a.pool,
      fecha: a.scan_date || a.date,
      hora: a.scan_time || a.time,
      estado: a.status
    }));
    exportService.exportToPDF(title, columns, data, 'asistencia_municipal.pdf');
    setShowExportOptions(false);
  };

  const handleExportExcel = () => {
    const data = filtered.map(a => ({
      Usuario: a.user_name || a.userName,
      'Tarjeta NFC': a.nfc_card || a.nfcCard,
      Servicio: a.service_name || a.service,
      Alberca: a.pool_name || a.pool,
      Fecha: a.scan_date || a.date,
      Hora: a.scan_time || a.time,
      Estado: a.status
    }));
    exportService.exportToExcel(data, 'asistencia_municipal.xlsx');
    setShowExportOptions(false);
  };

  const handleExportWord = () => {
    const title = 'Reporte de Asistencia — Alberca Municipal';
    const columns = ['Usuario', 'NFC', 'Servicio', 'Alberca', 'Fecha', 'Hora', 'Estado'];
    const data = filtered.map(a => [
      a.user_name || a.userName,
      a.nfc_card || a.nfcCard,
      a.service_name || a.service,
      a.pool_name || a.pool,
      a.scan_date || a.date,
      a.scan_time || a.time,
      a.status
    ]);
    exportService.exportToWord(title, columns, data, 'asistencia_municipal.doc');
    setShowExportOptions(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="loader" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registro de Asistencia</h1>
          <p className="page-subtitle">Historial real obtenido del servidor municipal</p>
        </div>
        <div className="page-actions" style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            id="export-attendance-btn"
            onClick={() => setShowExportOptions(!showExportOptions)}
          >
            <Download size={15} /> Exportar
          </button>
          
          {showExportOptions && (
            <div className="card shadow-lg animate-slide-up" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              zIndex: 100, width: 220, padding: 8, background: 'var(--color-surface)'
            }}>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Formatos</div>
              <button 
                className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }}
                onClick={handleExportPDF}
              >
                <FileText size={16} color="#ef4444" /> Descargar PDF (.pdf)
              </button>
              <button 
                className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }}
                onClick={handleExportExcel}
              >
                <TableIcon size={16} color="#10b981" /> Excel (Hoja de cálculo)
              </button>
              <button 
                className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }}
                onClick={handleExportWord}
              >
                <FileDigit size={16} color="#6366f1" /> Word (Documento editable)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="stat-grid mb-6">
        <div className="stat-card" style={{ '--stat-color': '#10b981', '--stat-bg': 'rgba(16,185,129,0.12)' }}>
          <div className="stat-icon" style={{ color: 'var(--color-success)', background: 'rgba(16,185,129,0.12)' }}><UserCheck size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">{attendance.filter(a => a.status === 'entrada').length}</div>
            <div className="stat-label">Entradas</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#ef4444', '--stat-bg': 'rgba(239,68,68,0.12)' }}>
          <div className="stat-icon" style={{ color: 'var(--color-danger)', background: 'rgba(239,68,68,0.12)' }}><LogOut size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">{attendance.filter(a => a.status === 'salida').length}</div>
            <div className="stat-label">Salidas</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#6366f1', '--stat-bg': 'rgba(99,102,241,0.12)' }}>
          <div className="stat-icon" style={{ color: 'var(--color-primary)', background: 'rgba(99,102,241,0.12)' }}><Users size={18} /></div>
          <div className="stat-info">
            <div className="stat-value">{new Set(attendance.map(a => a.user_id || a.userId)).size}</div>
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
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>No se encontraron registros en la base de datos</td></tr>
              ) : filtered.map((a, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{a.user_name || a.userName}</td>
                  <td><span className="badge badge-info">{a.nfc_card || a.nfcCard}</span></td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{a.service_name || a.service}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{a.pool_name || a.pool}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{a.scan_date || a.date}</td>
                  <td style={{ fontWeight: 600 }}>{a.scan_time || a.time}</td>
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
