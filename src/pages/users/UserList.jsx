import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Eye, Trash2, CreditCard, Download, FileText, Table as TableIcon, FileDigit, Key } from 'lucide-react';
import axios from 'axios';
import { useUsers } from '../../context/UserContext';
import { ROLE_LABELS, ROLE_COLORS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { exportService } from '../../services/exportService';
import UserModal from './UserModal'; // Novedad: Importar Modal abstracto

export default function UserList({ onNavigate }) {
  const { user } = useAuth();
  const { users, deleteUser, updateUser } = useUsers();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [activeUser, setActiveUser] = useState(null); // Data del usuario clickeado
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'

  const canCreate = user?.role === 'superadmin';
  const canEdit   = user?.role === 'superadmin' || user?.role === 'admin';

  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.nfcCard?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole   === 'all' || u.role   === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleResetPassword = async (u) => {
    if (window.confirm(`¿Seguro que deseas generar una nueva contraseña para ${u.name}?`)) {
      try {
        const res = await axios.put(`http://${window.location.hostname}:3001/api/users/${u.id}/reset-password`);
        alert(`Nueva contraseña generada para ${u.name}: ${res.data.newPassword}\n\nPor favor, entrega esta clave al usuario.`);
      } catch (err) {
        alert('Error al resetear la contraseña');
      }
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.status === 'activo' ? 'inactivo' : 'activo';
    try {
      await updateUser(u.id, { ...u, status: newStatus });
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  // -- EXPORTS --
  const handleExportPDF = () => {
    const title = 'Padrón de Usuarios — Sistema Municipal';
    const columns = [
      { header: 'Nombre', dataKey: 'nombre' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Rol', dataKey: 'rol' },
      { header: 'NFC', dataKey: 'nfc' },
      { header: 'Membresía', dataKey: 'membresia' },
      { header: 'Estado', dataKey: 'estado' },
    ];
    const data = filtered.map(u => ({
      nombre: u.name,
      email: u.email,
      rol: ROLE_LABELS[u.role],
      nfc: u.nfcCard || 'N/A',
      membresia: u.membership || 'Ninguda',
      estado: u.status
    }));
    exportService.exportToPDF(title, columns, data, 'usuarios_municipal.pdf');
    setShowExportOptions(false);
  };

  const handleExportExcel = () => {
    const data = filtered.map(u => ({
      Nombre: u.name,
      Email: u.email,
      Rol: ROLE_LABELS[u.role],
      'Tarjeta NFC': u.nfcCard || 'N/A',
      Membresía: u.membership || 'Ninguna',
      Estado: u.status,
      'Fecha Alta': u.joinDate
    }));
    exportService.exportToExcel(data, 'usuarios_municipal.xlsx');
    setShowExportOptions(false);
  };

  const handleExportWord = () => {
    const title = 'Directorio de Usuarios — Alberca Municipal';
    const columns = ['Nombre', 'Email', 'Rol', 'NFC', 'Estado', 'Fecha Registro'];
    const data = filtered.map(u => [
      u.name, u.email, ROLE_LABELS[u.role], u.nfcCard || 'N/A', u.status, u.joinDate
    ]);
    exportService.exportToWord(title, columns, data, 'usuarios_municipal.doc');
    setShowExportOptions(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">
            {users.length} usuarios registrados · {users.filter(u => u.status === 'activo').length} activos
          </p>
        </div>
        
        <div className="page-actions" style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowExportOptions(!showExportOptions)}
            id="export-users-btn"
          >
            <Download size={14} /> Exportar
          </button>

          {showExportOptions && (
            <div className="card shadow-lg animate-slide-up" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              zIndex: 100, width: 220, padding: 8, background: 'var(--color-surface)'
            }}>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Descargar Lista</div>
              <button 
                className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }}
                onClick={handleExportPDF}
              >
                <FileText size={16} color="#ef4444" /> Formato PDF (.pdf)
              </button>
              <button 
                className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }}
                onClick={handleExportExcel}
              >
                <TableIcon size={16} color="#10b981" /> Formato Excel (.xlsx)
              </button>
              <button 
                className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontSize: 13 }}
                onClick={handleExportWord}
              >
                <FileDigit size={16} color="#6366f1" /> Formato Word (.doc)
              </button>
            </div>
          )}

          {canCreate && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('/users/new')}
              id="add-user-btn"
            >
              <Plus size={16} /> Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por nombre, correo, NFC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="user-search"
          />
        </div>
        <select
          className="form-input form-select"
          style={{ width: 180 }}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          id="user-filter-role"
        >
          <option value="all">Todos los roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="form-input form-select"
          style={{ width: 160 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          id="user-filter-status"
        >
          <option value="all">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Tarjeta NFC</th>
                <th>Membresía</th>
                <th>Servicios</th>
                <th>Alta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : filtered.map(u => {
                const roleColor = ROLE_COLORS[u.role] || 'var(--color-primary)';
                const initials  = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${roleColor}, #22d3ee)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${roleColor}22`, color: roleColor }}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <CreditCard size={12} color="var(--color-text-muted)" />
                        <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
                          {u.nfcCard || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                      {u.membership || '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12, maxWidth: 180 }}>
                      <div className="truncate">{u.services?.join(', ') || '—'}</div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{u.joinDate}</td>
                    <td>
                      {canEdit ? (
                        <button
                          className={`badge ${u.status === 'activo' ? 'badge-success' : 'badge-danger'}`}
                          style={{ border: 'none', cursor: 'pointer' }}
                          onClick={() => handleToggleStatus(u)}
                          title="Clic para cambiar estado"
                          id={`toggle-status-${u.id}`}
                        >
                          {u.status}
                        </button>
                      ) : (
                        <span className={`badge ${u.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                          {u.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {canCreate && (
                          <button 
                            className="btn btn-ghost" 
                            title="Resetear Contraseña" 
                            onClick={() => handleResetPassword(u)} 
                            id={`reset-pass-${u.id}`}
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Key size={14} />
                          </button>
                        )}
                        <button className="btn btn-ghost" title="Ver perfil" onClick={() => { setActiveUser(u); setModalMode('view'); }} id={`view-user-${u.id}`}>
                          <Eye size={14} />
                        </button>
                        {canEdit && (
                          <button className="btn btn-ghost" title="Editar" onClick={() => { setActiveUser(u); setModalMode('edit'); }} id={`edit-user-${u.id}`}>
                            <Edit size={14} />
                          </button>
                        )}
                        {canCreate && u.id !== user?.id && (
                          <button
                            className="btn btn-ghost"
                            title="Eliminar"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => {
                              if (window.confirm(`¿Eliminar a ${u.name} del sistema?`)) deleteUser(u.id);
                            }}
                            id={`delete-user-${u.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeUser && (
        <UserModal 
          user={activeUser} 
          mode={modalMode} 
          onClose={() => setActiveUser(null)} 
          onSave={updateUser} 
          canEdit={canEdit} 
        />
      )}
    </div>
  );
}
