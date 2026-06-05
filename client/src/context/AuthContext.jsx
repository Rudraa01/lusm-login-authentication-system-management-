import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lusm_token');
    const savedDev = localStorage.getItem('lusm_developer');

    if (token && savedDev) {
      try {
        setDeveloper(JSON.parse(savedDev));
      } catch {
        localStorage.removeItem('lusm_token');
        localStorage.removeItem('lusm_developer');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/dash/login', { email, password });
    const { developer: dev, accessToken } = res.data.data;

    localStorage.setItem('lusm_token', accessToken);
    localStorage.setItem('lusm_developer', JSON.stringify(dev));
    setDeveloper(dev);

    return dev;
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/api/dash/signup', { name, email, password });
    const { developer: dev, accessToken } = res.data.data;

    localStorage.setItem('lusm_token', accessToken);
    localStorage.setItem('lusm_developer', JSON.stringify(dev));
    setDeveloper(dev);

    return dev;
  };

  const logout = () => {
    localStorage.removeItem('lusm_token');
    localStorage.removeItem('lusm_developer');
    setDeveloper(null);
  };

  const value = {
    developer,
    loading,
    isAuthenticated: !!developer,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
