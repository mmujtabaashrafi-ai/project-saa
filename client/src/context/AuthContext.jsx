import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rb_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('rb_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authApi.getMe();
        if (data.success) {
          setUser(data.user);
          setToken(savedToken);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('rb_token');
    localStorage.removeItem('rb_user');
    setUser(null);
    setToken(null);
  };

  const login = useCallback(async (username, password) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await authApi.login({ username, password });
      if (data.success) {
        localStorage.setItem('rb_token', data.token);
        localStorage.setItem('rb_user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // proceed with local logout even if API fails
    } finally {
      clearAuth();
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('rb_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
