import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtpConfirm, setShowOtpConfirm] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const { signup, verifyDeveloperOtp, resendDeveloperOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*@)[A-Za-z0-9@]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error('Password must be min 8 chars, 1 uppercase, 1 lowercase, 1 number, exactly 1 @ symbol');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success('Registration successful! Please verify your email with the OTP sent. ✉️');
      setShowOtpConfirm(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the verification code');
      return;
    }
    setLoading(true);
    try {
      await verifyDeveloperOtp(email, otp);
      toast.success('Email verified successfully! Welcome to AuthEasy 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await resendDeveloperOtp(email);
      toast.success('Verification code resent successfully! ✉️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  if (showOtpConfirm) {
    return (
      <div className="auth-page">
        <div className="auth-bg-effects">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
        </div>

        <div className="auth-container animate-slide-up">
          <div className="auth-logo">
            <div className="logo-icon">
              <img src="/logo.png" alt="AuthEasy" className="logo-img" />
            </div>
          </div>

          <h1 className="auth-title">Verify Email</h1>
          <p className="auth-subtitle">We sent a 6-digit verification code to {email}</p>

          <form onSubmit={handleOtpSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Verification Code (OTP)</label>
              <input
                id="signup-otp"
                type="text"
                className="form-input"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                required
              />
            </div>

            <button
              id="signup-otp-submit"
              type="submit"
              className="btn btn-primary btn-lg auth-btn"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Didn't receive the email?{' '}
            <button 
              onClick={handleResendOtp} 
              disabled={resendLoading}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
            >
              {resendLoading ? 'Resending...' : 'Resend Code'}
            </button>
          </div>

          <p className="auth-switch" style={{ marginTop: '24px' }}>
            <a href="#" onClick={() => setShowOtpConfirm(false)}>Back to Sign Up</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-container animate-slide-up">
        <Link to="/" className="auth-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="AuthEasy" className="logo-img" />
          </div>
        </Link>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start adding authentication to your apps</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
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
                id="signup-password"
                type="password"
                className="form-input"
                placeholder="Min 8 chars, 1 upper, 1 lower, 1 num, 1 @"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary btn-lg auth-btn"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Login instead</Link>
        </p>
      </div>
    </div>
  );
}
