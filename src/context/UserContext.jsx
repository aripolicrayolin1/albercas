import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://albercas.onrender.com/api') + ``;
const UserContext = createContext(null);

// ── helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique NFC card ID */
export function generateNFCCard(existingUsers = []) {
  const used = new Set(existingUsers.map(u => u.nfcCard));
  let attempt;
  do {
    const suffix = String(Math.floor(100 + Math.random() * 900));   // 3-digit random
    attempt = `NFC-US-${suffix}`;
  } while (used.has(attempt));
  return attempt;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from REAL backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (userData) => {
    const newUser = {
      id: `u${Date.now()}`,
      status: 'activo',
      joinDate: new Date().toISOString().split('T')[0],
      avatar: null,
      ...userData,
    };
    
    try {
      const res = await axios.post(`${API_URL}/users`, newUser);
      const createdUser = res.data.user;
      setUsers(prev => [createdUser, ...prev]);
      return createdUser;
    } catch (err) {
      console.error('Error adding user:', err);
      throw err;
    }
  };

  const updateUser = async (id, updates) => {
    try {
      await axios.put(`${API_URL}/users/${id}`, updates);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch(err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  const getUserById = (id) => users.find(u => u.id === id) || null;

  const getUserByNFC = async (nfcCard) => {
    try {
      const res = await axios.get(`${API_URL}/users/nfc/${nfcCard}`);
      return res.data;
    } catch (err) {
      return null;
    }
  };

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, getUserById, getUserByNFC }}>
      {children}
    </UserContext.Provider>
  );
}

// ── hook ──────────────────────────────────────────────────────────────────────

export function useUsers() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUsers must be used inside UserProvider');
  return ctx;
}
