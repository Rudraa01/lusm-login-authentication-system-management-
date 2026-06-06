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
    const token = localStorage.getItem('autheasy_token');
    const savedDev = localStorage.getItem('autheasy_developer');

    if (token && savedDev) {
      try {
        setDeveloper(JSON.parse(savedDev));
      } catch {
        localStorage.removeItem('autheasy_token');
        localStorage.removeItem('autheasy_developer');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/dash/login', { email, password });
    const { developer: dev, accessToken } = res.data.data;

    localStorage.setItem('autheasy_token', accessToken);
    localStorage.setItem('autheasy_developer', JSON.stringify(dev));
    setDeveloper(dev);

    return dev;
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/api/dash/signup', { name, email, password });
    return res.data;
  };

  const verifyDeveloperOtp = async (email, otp) => {
    const res = await api.post('/api/dash/verify-otp', { email, otp });
    const { developer: dev, accessToken } = res.data.data;

    localStorage.setItem('autheasy_token', accessToken);
    localStorage.setItem('autheasy_developer', JSON.stringify(dev));
    setDeveloper(dev);

    return dev;
  };

  const resendDeveloperOtp = async (email) => {
    const res = await api.post('/api/dash/resend-otp', { email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('autheasy_token');
    localStorage.removeItem('autheasy_developer');
    setDeveloper(null);
  };

  const value = {
    developer,
    loading,
    isAuthenticated: !!developer,
    login,
    signup,
    verifyDeveloperOtp,
    resendDeveloperOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
