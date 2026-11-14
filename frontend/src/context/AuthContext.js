'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '@/lib/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const stored = localStorage.getItem(TOKEN_KEY);
    const check = stored ? api.getMe(stored) : Promise.resolve(null);
    check
      .then((me) => {
        if (ignore || !me) return;
        setToken(stored);
        setUser(me);
      })
      .catch((err) => {
        if (err.status === 401) localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const startSession = useCallback(async (newToken) => {
    const me = await api.getMe(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(me);
  }, []);

  const login = useCallback(
    async (email, password) => startSession((await api.login(email, password)).token),
    [startSession]
  );

  const register = useCallback(
    async (fields) => startSession((await api.register(fields)).token),
    [startSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout(token);
    } catch {
      // the token is cleared locally regardless
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
