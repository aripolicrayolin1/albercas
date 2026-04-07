import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../data/mockData';

const STORAGE_KEY = 'app_users';

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

/** Seed from localStorage or fall back to mock data */
function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return mockUsers;
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);

  // persist on every change
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  const addUser = (userData) => {
    const newUser = {
      id: `u${Date.now()}`,
      status: 'activo',
      joinDate: new Date().toISOString().split('T')[0],
      avatar: null,
      ...userData,
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const getUserById = (id) => users.find(u => u.id === id) || null;

  const getUserByNFC = (nfcCard) => users.find(u => u.nfcCard === nfcCard) || null;

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
