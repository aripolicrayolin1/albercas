import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2, CreditCard } from 'lucide-react';
import { useUsers } from '../../context/UserContext';
import { ROLE_LABELS, ROLE_COLORS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';

export default function UserList({ onNavigate }) {
  const { user } = useAuth();
  const { users, deleteUser, updateUser } = useUsers();   // ← real context
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const handleToggleStatus = (u) => {
    updateUser(u.id, { status: u.status === 'activo' ? 'inactivo' : 'activo' });
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
        {canCreate && (
          <div className="page-actions">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('/users/new')}
              id="add-user-btn"
            >
              <Plus size={16} /> Nuevo Usuario
            </button>
          </div>
        )}
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
                    {/* Avatar + name */}
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
                    {/* NFC card */}
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
                      {/* Clickable status to toggle */}
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
                        <button className="btn btn-ghost" title="Ver perfil" id={`view-user-${u.id}`}>
                          <Eye size={14} />
                        </button>
                        {canEdit && (
                          <button className="btn btn-ghost" title="Editar" id={`edit-user-${u.id}`}>
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
    </div>
  );
}
