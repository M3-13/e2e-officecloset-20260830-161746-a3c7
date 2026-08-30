import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { request } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const data = await request('POST', '/api/auth/login', { email, password });
    const accessToken = data.access_token;
    const currentUser = { email };
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    setToken(accessToken);
    setUser(currentUser);
    return data;
  }, []);

  const register = useCallback(async (email, password) => {
    const data = await request('POST', '/api/auth/register', { email, password });
    const accessToken = data.access_token;
    const currentUser = { email };
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(currentUser));
    setToken(accessToken);
    setUser(currentUser);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, register, logout }),
    [user, token, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
