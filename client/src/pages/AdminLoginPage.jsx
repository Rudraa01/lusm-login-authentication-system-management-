import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminPages.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back, Owner! 🛡️');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth-page">
      <div className="auth-bg-effects">
        <div className="auth-orb admin-orb-1" />
        <div className="auth-orb admin-orb-2" />
      </div>

      <div className="auth-container admin-auth-container animate-slide-up">
        <div className="auth-logo admin-logo">
          <div className="logo-icon">🛡️</div>
          <span className="logo-text admin-logo-text-header">LUSM Admin</span>
        </div>

        <h1 className="auth-title">Super Admin Access</h1>
        <p className="auth-subtitle">Manage LUSM developers & platform metrics</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="admin-login-email"
                type="email"
                className="form-input admin-input"
                placeholder="admin@lusm.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="admin-login-password"
                type="password"
                className="form-input admin-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            className="btn btn-warning btn-lg auth-btn admin-btn"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                Enter Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
