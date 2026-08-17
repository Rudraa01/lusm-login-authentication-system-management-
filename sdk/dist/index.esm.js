import React, { useState, useEffect, useCallback, useContext, useRef, createContext } from 'react';

/**
 * @autheasy/react - Official React SDK for AuthEasy
 * 
 * All API calls, state management, token storage, and session handling
 * are handled automatically. The developer only needs their API key.
 */


// ─── Constants ─────────────────────────────────────────────────────────────
const AUTHEASY_API_BASE = 'https://autheasy.me/api/v1/auth';
const STORAGE_KEY_TOKEN = 'autheasy_access_token';
const STORAGE_KEY_REFRESH = 'autheasy_refresh_token';
const STORAGE_KEY_USER = 'autheasy_user';

// ─── Context ────────────────────────────────────────────────────────────────
const AuthEasyContext = /*#__PURE__*/createContext(null);

// ─── Internal API Helper ───────────────────────────────────────────────────
function createApiClient(apiKey) {
  const call = async (endpoint, method = 'POST', body = null, token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${AUTHEASY_API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || 'AuthEasy API error');
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  };
  return {
    call
  };
}

// ─── AuthEasyProvider ──────────────────────────────────────────────────────
/**
 * Wrap your app with this provider.
 * 
 * @param {string} apiKey - Your AuthEasy project API key (from dashboard)
 * @param {string} [baseUrl] - Optional custom backend URL (defaults to https://autheasy.me)
 * 
 * @example
 * <AuthEasyProvider apiKey="ae_live_xxxxxxxx">
 *   <App />
 * </AuthEasyProvider>
 */
function AuthEasyProvider({
  apiKey,
  baseUrl,
  children
}) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const api = createApiClient(apiKey);

  // ─── Restore session on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!apiKey) {
      console.error('[AuthEasy] No apiKey provided to <AuthEasyProvider>. Please pass your project API key.');
      setLoading(false);
      return;
    }
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_REFRESH);
      }
    }
    setLoading(false);
  }, [apiKey]);

  // ─── Internal: save session ───────────────────────────────────────────────
  const _saveSession = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    if (refreshToken) localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
  }, []);

  // ─── signup ───────────────────────────────────────────────────────────────
  /**
   * Register a new user. Sends an OTP to their email.
   * 
   * @param {{ email: string, password: string, name?: string, phone?: string }} params
   * @returns {{ success: boolean, message: string, userId: string }}
   * 
   * @example
   * const res = await signup({ email: 'user@example.com', password: 'Pass@123', name: 'John' });
   * // Now call verifyOtp({ email, otp }) to complete registration
   */
  const signup = useCallback(async ({
    email,
    password,
    name = '',
    phone = ''
  }) => {
    setAuthError(null);
    const data = await api.call('/register', 'POST', {
      email,
      password,
      name,
      phone
    });
    return data;
  }, [api]);

  // ─── verifyOtp ────────────────────────────────────────────────────────────
  /**
   * Verify OTP sent to user's email after signup.
   * On success, automatically logs the user in.
   * 
   * @param {{ email: string, otp: string }} params
   * @returns {{ success: boolean, user: object, accessToken: string }}
   * 
   * @example
   * const res = await verifyOtp({ email: 'user@example.com', otp: '123456' });
   * // res.user is now available
   */
  const verifyOtp = useCallback(async ({
    email,
    otp
  }) => {
    setAuthError(null);
    const data = await api.call('/verify-otp', 'POST', {
      email,
      otp
    });
    if (data.success && data.data) {
      _saveSession(data.data.user, data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }, [api, _saveSession]);

  // ─── resendOtp ────────────────────────────────────────────────────────────
  /**
   * Resend the OTP email to the user.
   * 
   * @param {{ email: string }} params
   * @returns {{ success: boolean, message: string }}
   */
  const resendOtp = useCallback(async ({
    email
  }) => {
    setAuthError(null);
    const data = await api.call('/resend-otp', 'POST', {
      email
    });
    return data;
  }, [api]);

  // ─── login ────────────────────────────────────────────────────────────────
  /**
   * Log in an existing user with email and password.
   * On success, session is saved automatically.
   * 
   * @param {{ email: string, password: string }} params
   * @returns {{ success: boolean, user: object, accessToken: string }}
   * 
   * @example
   * const res = await login({ email: 'user@example.com', password: 'Pass@123' });
   * console.log(res.user.name); // "John"
   */
  const login = useCallback(async ({
    email,
    password
  }) => {
    setAuthError(null);
    const data = await api.call('/login', 'POST', {
      email,
      password
    });
    if (data.success && data.data) {
      _saveSession(data.data.user, data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }, [api, _saveSession]);

  // ─── logout ───────────────────────────────────────────────────────────────
  /**
   * Log out the current user and clear their session.
   * 
   * @example
   * logout();
   */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }, []);

  // ─── forgotPassword ───────────────────────────────────────────────────────
  /**
   * Send a password reset OTP to the user's email.
   * 
   * @param {{ email: string }} params
   * @returns {{ success: boolean, message: string }}
   */
  const forgotPassword = useCallback(async ({
    email
  }) => {
    setAuthError(null);
    const data = await api.call('/forgot-password', 'POST', {
      email
    });
    return data;
  }, [api]);

  // ─── resetPassword ────────────────────────────────────────────────────────
  /**
   * Reset password using the OTP sent to the user's email.
   * 
   * @param {{ email: string, otp: string, newPassword: string }} params
   * @returns {{ success: boolean, message: string }}
   */
  const resetPassword = useCallback(async ({
    email,
    otp,
    newPassword
  }) => {
    setAuthError(null);
    const data = await api.call('/reset-password', 'POST', {
      email,
      otp,
      newPassword
    });
    return data;
  }, [api]);

  // ─── getAccessToken ───────────────────────────────────────────────────────
  /**
   * Get the current user's access token (for making authenticated API calls to your own backend).
   * 
   * @returns {string|null}
   * 
   * @example
   * const token = getAccessToken();
   * fetch('/api/my-endpoint', { headers: { Authorization: `Bearer ${token}` } });
   */
  const getAccessToken = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }, []);
  const value = {
    // ─── State ────────────────────────────
    user,
    isAuthenticated,
    loading,
    authError,
    // ─── Auth Methods ──────────────────────
    signup,
    verifyOtp,
    resendOtp,
    login,
    logout,
    forgotPassword,
    resetPassword,
    getAccessToken
  };
  return /*#__PURE__*/React.createElement(AuthEasyContext.Provider, {
    value: value
  }, children);
}

// ─── useAuthEasy hook ──────────────────────────────────────────────────────
/**
 * Hook to access AuthEasy auth state and methods inside any component.
 * Must be used inside <AuthEasyProvider>.
 * 
 * @returns {{ user, isAuthenticated, loading, login, signup, verifyOtp, resendOtp, logout, forgotPassword, resetPassword, getAccessToken }}
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuthEasy();
 */
function useAuthEasy() {
  const ctx = useContext(AuthEasyContext);
  if (!ctx) {
    throw new Error('[AuthEasy] useAuthEasy() must be used inside <AuthEasyProvider>. Did you forget to wrap your app?');
  }
  return ctx;
}

// ─── AuthButton Component ──────────────────────────────────────────────────
/**
 * Drop-in Login/Signup button with built-in modal UI.
 * Handles everything: form, OTP, error messages, and session saving.
 * 
 * @param {'dark'|'light'} [theme='dark'] - Color theme of the modal
 * @param {string} [className] - Optional extra CSS class on the trigger button
 * @param {string} [buttonText='Sign In'] - Text shown on the trigger button
 * 
 * @example
 * <AuthButton theme="dark" buttonText="Login / Register" />
 */
function AuthButton({
  theme = 'dark',
  className = '',
  buttonText = 'Sign In'
}) {
  const {
    login,
    signup,
    verifyOtp,
    resendOtp,
    isAuthenticated,
    logout,
    user
  } = useAuthEasy();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'otp'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    otp: ''
  });
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: ''
  });
  const dialogRef = useRef(null);
  const dark = theme !== 'light';
  const colors = {
    overlay: 'rgba(0,0,0,0.7)',
    card: dark ? '#111827' : '#ffffff',
    border: dark ? '#1f2937' : '#e5e7eb',
    input: dark ? '#1e293b' : '#f9fafb',
    inputBorder: dark ? '#334155' : '#d1d5db',
    inputText: dark ? '#f1f5f9' : '#1f2937',
    label: dark ? '#94a3b8' : '#6b7280',
    title: dark ? '#f8fafc' : '#111827',
    text: dark ? '#9ca3af' : '#6b7280',
    accent: '#c7a872',
    btnBg: dark ? '#c7a872' : '#1f2937',
    btnText: dark ? '#0f172a' : '#ffffff',
    close: dark ? '#94a3b8' : '#6b7280'
  };
  useEffect(() => {
    if (!open) setStatus({
      loading: false,
      error: '',
      success: ''
    });
  }, [open]);
  const handleField = e => setForm(f => ({
    ...f,
    [e.target.name]: e.target.value
  }));
  const handleLogin = async e => {
    e.preventDefault();
    setStatus({
      loading: true,
      error: '',
      success: ''
    });
    try {
      await login({
        email: form.email,
        password: form.password
      });
      setOpen(false);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message,
        success: ''
      });
    }
  };
  const handleSignup = async e => {
    e.preventDefault();
    setStatus({
      loading: true,
      error: '',
      success: ''
    });
    try {
      await signup({
        email: form.email,
        password: form.password,
        name: form.name
      });
      setStatus({
        loading: false,
        error: '',
        success: 'Verification code sent! Check your email.'
      });
      setMode('otp');
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message,
        success: ''
      });
    }
  };
  const handleOtp = async e => {
    e.preventDefault();
    setStatus({
      loading: true,
      error: '',
      success: ''
    });
    try {
      await verifyOtp({
        email: form.email,
        otp: form.otp
      });
      setOpen(false);
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message,
        success: ''
      });
    }
  };
  const handleResend = async () => {
    setStatus({
      loading: true,
      error: '',
      success: ''
    });
    try {
      await resendOtp({
        email: form.email
      });
      setStatus({
        loading: false,
        error: '',
        success: 'Code resent!'
      });
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message,
        success: ''
      });
    }
  };
  if (isAuthenticated && user) {
    return /*#__PURE__*/React.createElement("button", {
      onClick: logout,
      className: className,
      style: btnStyle(colors)
    }, "Logout (", user.name || user.email, ")");
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(true),
    className: className,
    style: btnStyle(colors)
  }, buttonText), open && /*#__PURE__*/React.createElement("div", {
    ref: dialogRef,
    onClick: e => e.target === dialogRef.current && setOpen(false),
    style: overlayStyle(colors)
  }, /*#__PURE__*/React.createElement("div", {
    style: cardStyle(colors)
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(false),
    style: closeStyle(colors)
  }, "\u2715"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://autheasy.me/logo.png",
    alt: "AuthEasy",
    style: {
      height: '40px',
      marginBottom: '12px'
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: '20px',
      fontWeight: 700,
      color: colors.title
    }
  }, mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Verify Email'), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: '13px',
      color: colors.text
    }
  }, mode === 'otp' ? `Enter the 6-digit code sent to ${form.email}` : mode === 'login' ? 'Sign in to continue' : 'Join in seconds')), status.error && /*#__PURE__*/React.createElement("div", {
    style: alertStyle('error')
  }, status.error), status.success && /*#__PURE__*/React.createElement("div", {
    style: alertStyle('success')
  }, status.success), mode === 'login' && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleLogin,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    name: "email",
    type: "email",
    value: form.email,
    onChange: handleField,
    colors: colors,
    placeholder: "you@example.com"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Password",
    name: "password",
    type: "password",
    value: form.password,
    onChange: handleField,
    colors: colors,
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  }), /*#__PURE__*/React.createElement(SubmitButton, {
    loading: status.loading,
    colors: colors
  }, "Sign In"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      fontSize: '13px',
      color: colors.text,
      margin: 0
    }
  }, "Don't have an account?", ' ', /*#__PURE__*/React.createElement("span", {
    onClick: () => setMode('signup'),
    style: {
      color: colors.accent,
      cursor: 'pointer',
      fontWeight: 600
    }
  }, "Sign up"))), mode === 'signup' && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSignup,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Name",
    name: "name",
    type: "text",
    value: form.name,
    onChange: handleField,
    colors: colors,
    placeholder: "John Doe"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Email",
    name: "email",
    type: "email",
    value: form.email,
    onChange: handleField,
    colors: colors,
    placeholder: "you@example.com"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Password",
    name: "password",
    type: "password",
    value: form.password,
    onChange: handleField,
    colors: colors,
    placeholder: "Min 8 chars, use @ symbol"
  }), /*#__PURE__*/React.createElement(SubmitButton, {
    loading: status.loading,
    colors: colors
  }, "Create Account"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      fontSize: '13px',
      color: colors.text,
      margin: 0
    }
  }, "Already have an account?", ' ', /*#__PURE__*/React.createElement("span", {
    onClick: () => setMode('login'),
    style: {
      color: colors.accent,
      cursor: 'pointer',
      fontWeight: 600
    }
  }, "Sign in"))), mode === 'otp' && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleOtp,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    name: "otp",
    type: "text",
    maxLength: 6,
    value: form.otp,
    onChange: handleField,
    placeholder: "\u2022 \u2022 \u2022 \u2022 \u2022 \u2022",
    style: {
      ...inputStyle(colors),
      textAlign: 'center',
      fontSize: '22px',
      letterSpacing: '8px'
    },
    required: true
  }), /*#__PURE__*/React.createElement(SubmitButton, {
    loading: status.loading,
    colors: colors
  }, "Verify & Log In"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      fontSize: '13px',
      color: colors.text,
      margin: 0
    }
  }, "Didn't get it?", ' ', /*#__PURE__*/React.createElement("span", {
    onClick: handleResend,
    style: {
      color: colors.accent,
      cursor: 'pointer',
      fontWeight: 600
    }
  }, "Resend code"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: '20px',
      fontSize: '11px',
      color: colors.text,
      opacity: 0.6
    }
  }, "Secured by ", /*#__PURE__*/React.createElement("a", {
    href: "https://autheasy.me",
    target: "_blank",
    rel: "noreferrer",
    style: {
      color: colors.accent,
      textDecoration: 'none',
      fontWeight: 600
    }
  }, "AuthEasy")))));
}

// ─── Style Helpers (no CSS-in-JS deps) ─────────────────────────────────────
const Field = ({
  label,
  name,
  type,
  value,
  onChange,
  colors,
  placeholder
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
  style: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: colors.label,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
}, label), /*#__PURE__*/React.createElement("input", {
  name: name,
  type: type,
  value: value,
  onChange: onChange,
  placeholder: placeholder,
  required: true,
  style: inputStyle(colors)
}));
const SubmitButton = ({
  loading,
  colors,
  children
}) => /*#__PURE__*/React.createElement("button", {
  type: "submit",
  disabled: loading,
  style: {
    width: '100%',
    padding: '11px',
    borderRadius: '10px',
    border: 'none',
    background: loading ? '#9ca3af' : colors.accent,
    color: colors.btnText,
    fontWeight: 700,
    fontSize: '14px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    marginTop: '4px'
  }
}, loading ? 'Please wait...' : children);
const inputStyle = colors => ({
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: `1px solid ${colors.inputBorder}`,
  background: colors.input,
  color: colors.inputText,
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
});
const btnStyle = colors => ({
  padding: '9px 18px',
  borderRadius: '9px',
  border: 'none',
  background: colors.accent,
  color: colors.btnText,
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit'
});
const overlayStyle = colors => ({
  position: 'fixed',
  inset: 0,
  background: colors.overlay,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px',
  backdropFilter: 'blur(4px)'
});
const cardStyle = colors => ({
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: '20px',
  padding: '32px 28px',
  width: '100%',
  maxWidth: '400px',
  position: 'relative',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  boxShadow: '0 24px 60px rgba(0,0,0,0.4)'
});
const closeStyle = colors => ({
  position: 'absolute',
  top: '16px',
  right: '16px',
  background: 'none',
  border: 'none',
  color: colors.close,
  fontSize: '18px',
  cursor: 'pointer',
  lineHeight: 1,
  padding: '4px'
});
const alertStyle = type => ({
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  marginBottom: '12px',
  background: type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
  color: type === 'error' ? '#f87171' : '#4ade80',
  border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`
});

export { AuthButton, AuthEasyProvider, useAuthEasy };
