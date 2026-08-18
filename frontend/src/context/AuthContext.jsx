import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  registerRequest,
  loginRequest,
  fetchCurrentUser,
  logoutRequest,
} from '../services/authService';
import { AUTH_TOKEN_KEY } from '../constants/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setInitializing(false);
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  useEffect(() => {
    const clearOnUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', clearOnUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', clearOnUnauthorized);
  }, []);

  const register = useCallback(async (data) => {
    const { user: loggedInUser, token } = await registerRequest(data);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token } = await loginRequest(credentials);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Token may already be invalid/expired — clear client state regardless.
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission) => Boolean(user?.permissions?.includes(permission)),
    [user]
  );

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    initializing,
    register,
    login,
    logout,
    hasPermission,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
