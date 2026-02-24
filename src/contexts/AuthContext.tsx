import React, { createContext, useCallback, useEffect, useState } from 'react';
import {
  User,
  Session,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  logoutAll as apiLogoutAll,
  getCurrentUser,
  getSessions,
  revokeSession as apiRevokeSession,
  changePassword as apiChangePassword,
  getAccessToken,
  setAccessToken,
  getErrorMessage,
} from '../services/authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<number>;
  refreshUser: () => Promise<void>;
  sessions: Session[];
  loadSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Token refresh interval (14 minutes, token expires in 15)
const REFRESH_INTERVAL = 14 * 60 * 1000;

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const isAuthenticated = user !== null;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;

    try {
      const { user } = await getCurrentUser();
      setUser(user);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!getAccessToken()) return;

    try {
      const { sessions } = await getSessions();
      setSessions(sessions);
    } catch {
      setSessions([]);
    }
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user } = await apiLogin(email, password);
      setUser(user);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user } = await apiRegister(email, password);
      setUser(user);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setSessions([]);
      setAccessToken(null);
    }
  }, []);

  // Logout all sessions
  const logoutAll = useCallback(async () => {
    const { revokedCount } = await apiLogoutAll();
    setUser(null);
    setSessions([]);
    return revokedCount;
  }, []);

  // Revoke session
  const revokeSession = useCallback(async (sessionId: string) => {
    await apiRevokeSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  // Change password
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await apiChangePassword(oldPassword, newPassword);
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const { refreshAccessToken } = await import('../services/authService');
        const { user } = await refreshAccessToken();
        setUser(user);
      } catch {
        setUser(null);
        setAccessToken(null);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle logout event from interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setSessions([]);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      if (getAccessToken()) {
        try {
          const { user } = await getCurrentUser();
          setUser(user);
        } catch {
          // Try to refresh token
          try {
            const { refreshAccessToken } = await import('../services/authService');
            const { user } = await refreshAccessToken();
            setUser(user);
          } catch {
            setAccessToken(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
    sessions,
    loadSessions,
    revokeSession,
    changePassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
