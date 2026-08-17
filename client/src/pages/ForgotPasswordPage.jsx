import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { forgotDeveloperPassword, resetDeveloperPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await forgotDeveloperPassword(email);
      toast.success('If an account exists, a 6-digit verification code has been sent ✉️');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*@)[A-Za-z0-9@]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must be min 8 chars, 1 uppercase, 1 lowercase, 1 number, and exactly 1 @ symbol');
      return;
    }

    setLoading(true);
    try {
      await resetDeveloperPassword(email, otp, newPassword);
      toast.success('Password reset successfully! Welcome back 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await forgotDeveloperPassword(email);
      toast.success('Verification code resent successfully! ✉️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <Link to="/" className="back-to-home-link">
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="auth-container animate-slide-up">
        <Link to="/" className="auth-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="AuthEasy" className="logo-img" />
          </div>
        </Link>

        {step === 1 ? (
          <>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              Enter the email address associated with your developer account
            </p>

            <form onSubmit={handleRequestOtp} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="btn btn-primary btn-lg auth-btn"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Remember your password?{' '}
              <Link to="/login">Back to login</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Set New Password</h1>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to <strong style={{ color: 'var(--text-white)' }}>{email}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label className="form-label">Verification Code (OTP)</label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="reset-otp"
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
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Lock size={18} className="input-icon" />
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 num, 1 @"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="reset-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                id="reset-submit"
                type="submit"
                className="btn btn-primary btn-lg auth-btn"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    Reset Password & Log In
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Didn't receive the email?{' '}
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'underline',
                }}
              >
                {resendLoading ? 'Resending...' : 'Resend Code'}
              </button>
            </div>

            <p className="auth-switch" style={{ marginTop: '20px' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setStep(1);
                }}
              >
                Change Email / Back
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
