import React, { useState } from 'react';
import { Waves, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS, ROLE_LABELS } from '../data/roles';

export default function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // Simulate auth delay

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      onLoginSuccess?.();
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      {/* Decorative blobs */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '10%', left: '5%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '15%', right: '8%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="login-card" role="main">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Waves size={24} color="white" />
          </div>
          <div>
            <div className="login-title">Albercas Municipales</div>
          </div>
        </div>

        <p className="login-subtitle">
          Sistema de Gestión & Asistencia NFC
        </p>

        {/* Error */}
        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }} />
              <input
                id="login-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="usuario@municipio.mx"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 36, paddingRight: 40 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                }}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ marginTop: 8, height: 44, fontSize: 15, justifyContent: 'center' }}
            id="login-submit-btn"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="loader" style={{ width: 16, height: 16 }} />
                Autenticando...
              </span>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="demo-accounts">
          <div className="demo-label">Acceso rápido — cuentas de demostración</div>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.userId}
                className="demo-btn"
                onClick={() => fillDemo(account)}
                id={`demo-${account.role}`}
              >
                {ROLE_LABELS[account.role]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
