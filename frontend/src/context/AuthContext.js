'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '@/lib/api';

export const AuthContext = createContext(null);

const SERVER_ERROR = 'Could not reach the server. Please try again later.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    try {
      // older versions kept the token here; the session now lives in the httpOnly cookie
      localStorage.removeItem('token');
    } catch {
      // storage may be unavailable
    }
    api
      .getMe()
      .then((me) => {
        if (!ignore) setUser(me);
      })
      .catch((err) => {
        if (!ignore && err.status !== 401) setError(SERVER_ERROR);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const startSession = useCallback(async () => {
    const me = await api.getMe();
    setUser(me);
    setError('');
  }, []);

  const login = useCallback(
    async (email, password) => {
      await api.login(email, password);
      await startSession();
    },
    [startSession]
  );

  const register = useCallback(
    async (fields) => {
      await api.register(fields);
      await startSession();
    },
    [startSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // the user is cleared locally regardless
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
