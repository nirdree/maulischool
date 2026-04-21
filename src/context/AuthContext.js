'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/api/client';
import { API } from '@/api/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ✅ Load user from localStorage safely (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sms_user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.log('Failed to parse user');
    } finally {
      setInitialized(true);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post(API.AUTH.LOGIN, { email, password });
      const payload = res.data ?? res;

      const { token, user: userData } = payload;

      if (!token || !userData) {
        return { success: false, message: 'Unexpected response from server' };
      }

      localStorage.setItem('sms_token', token);
      localStorage.setItem('sms_user', JSON.stringify(userData));

      setUser(userData);

      return { success: true, role: userData.role };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('sms_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, updateUser, initialized }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};