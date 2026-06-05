import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lusm_admin_token');
    const savedAdmin = localStorage.getItem('lusm_admin');

    if (token && savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch {
        localStorage.removeItem('lusm_admin_token');
        localStorage.removeItem('lusm_admin');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/admin/login', { email, password });
    const { admin: adminData, accessToken } = res.data.data;

    localStorage.setItem('lusm_admin_token', accessToken);
    localStorage.setItem('lusm_admin', JSON.stringify(adminData));
    setAdmin(adminData);

    return adminData;
  };

  const logout = () => {
    localStorage.removeItem('lusm_admin_token');
    localStorage.removeItem('lusm_admin');
    setAdmin(null);
  };

  const value = {
    admin,
    loading,
    isAuthenticated: !!admin,
    login,
    logout,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
