import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../data/mockData';
import { DEMO_ACCOUNTS } from '../data/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const account = DEMO_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (!account) return { success: false, error: 'Credenciales incorrectas' };
    const userData = mockUsers.find(u => u.id === account.userId);
    if (!userData) return { success: false, error: 'Usuario no encontrado' };
    const sessionUser = { ...userData, role: account.role };
    setUser(sessionUser);
    localStorage.setItem('auth_user', JSON.stringify(sessionUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('auth_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
