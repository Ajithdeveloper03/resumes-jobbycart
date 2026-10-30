import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('inymart_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('inymart_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('inymart_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('inymart_token', res.data.token);
      localStorage.setItem('inymart_user', JSON.stringify(res.data.user));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('inymart_token');
      localStorage.removeItem('inymart_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
