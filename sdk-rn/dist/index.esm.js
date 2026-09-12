import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { StyleSheet, Modal, KeyboardAvoidingView, Platform, ScrollView, View, TouchableOpacity, Text, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

// ─── Constants ──────────────────────────────────────────────────────────────
const AUTHEASY_API_BASE = 'https://autheasy.me/api/v1/auth';
const KEY_TOKEN = 'autheasy_access_token';
const KEY_REFRESH = 'autheasy_refresh_token';
const KEY_USER = 'autheasy_user';

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthEasyContext = /*#__PURE__*/createContext(null);

// ─── Internal API helper ──────────────────────────────────────────────────────
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
      throw error;
    }
    return data;
  };
  return {
    call
  };
}

// ─── AuthEasyProvider ─────────────────────────────────────────────────────────
/**
 * Wrap your app's root with this.
 *
 * @param {string} apiKey  - Your AuthEasy project API key
 *
 * @example
 * // App.js
 * import { AuthEasyProvider } from 'autheasy-react-native';
 *
 * export default function App() {
 *   return (
 *     <AuthEasyProvider apiKey="ae_live_xxxxxxxx">
 *       <NavigationContainer>...</NavigationContainer>
 *     </AuthEasyProvider>
 *   );
 * }
 */
function AuthEasyProvider({
  apiKey,
  children
}) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const api = createApiClient(apiKey);

  // Restore session from AsyncStorage
  useEffect(() => {
    if (!apiKey) {
      console.error('[AuthEasy] No apiKey provided to <AuthEasyProvider>.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([AsyncStorage.getItem(KEY_TOKEN), AsyncStorage.getItem(KEY_USER)]);
        if (savedToken && savedUser) {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch {
        await AsyncStorage.multiRemove([KEY_TOKEN, KEY_USER, KEY_REFRESH]);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiKey]);

  // ── Save session ────────────────────────────────────────────────────────────
  const _saveSession = useCallback(async (userData, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([[KEY_TOKEN, accessToken], [KEY_USER, JSON.stringify(userData)], ...(refreshToken ? [[KEY_REFRESH, refreshToken]] : [])]);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
  }, []);

  // ── signup ──────────────────────────────────────────────────────────────────
  /**
   * Register a new user. Sends OTP to their email.
   * @param {{ email, password, name?, phone? }} params
   */
  const signup = useCallback(async ({
    email,
    password,
    name = '',
    phone = ''
  }) => {
    setAuthError(null);
    return api.call('/register', 'POST', {
      email,
      password,
      name,
      phone
    });
  }, [api]);

  // ── verifyOtp ───────────────────────────────────────────────────────────────
  /**
   * Verify OTP after signup. Auto-logs in on success.
   * @param {{ email, otp }} params
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
      await _saveSession(data.data.user, data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }, [api, _saveSession]);

  // ── resendOtp ───────────────────────────────────────────────────────────────
  const resendOtp = useCallback(async ({
    email
  }) => {
    setAuthError(null);
    return api.call('/resend-otp', 'POST', {
      email
    });
  }, [api]);

  // ── login ───────────────────────────────────────────────────────────────────
  /**
   * Login with email + password. Session saved automatically.
   * @param {{ email, password }} params
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
      await _saveSession(data.data.user, data.data.accessToken, data.data.refreshToken);
    }
    return data;
  }, [api, _saveSession]);

  // ── logout ──────────────────────────────────────────────────────────────────
  /**
   * Log out and clear session.
   */
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([KEY_TOKEN, KEY_USER, KEY_REFRESH]);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }, []);

  // ── forgotPassword ──────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async ({
    email
  }) => {
    setAuthError(null);
    return api.call('/forgot-password', 'POST', {
      email
    });
  }, [api]);

  // ── resetPassword ───────────────────────────────────────────────────────────
  const resetPassword = useCallback(async ({
    email,
    otp,
    newPassword
  }) => {
    setAuthError(null);
    return api.call('/reset-password', 'POST', {
      email,
      otp,
      newPassword
    });
  }, [api]);

  // ── getAccessToken ──────────────────────────────────────────────────────────
  /**
   * Get current JWT for your own authenticated API calls.
   * @returns {Promise<string|null>}
   */
  const getAccessToken = useCallback(async () => {
    return AsyncStorage.getItem(KEY_TOKEN);
  }, []);
  const value = {
    user,
    isAuthenticated,
    loading,
    authError,
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

// ─── useAuthEasy hook ─────────────────────────────────────────────────────────
/**
 * Access auth state + methods anywhere in your app.
 * Must be inside <AuthEasyProvider>.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuthEasy();
 */
function useAuthEasy() {
  const ctx = useContext(AuthEasyContext);
  if (!ctx) {
    throw new Error('[AuthEasy] useAuthEasy() must be inside <AuthEasyProvider>');
  }
  return ctx;
}

// ─── AuthModal Component ──────────────────────────────────────────────────────
/**
 * Drop-in login/signup modal for React Native.
 * Handles the full flow: Login → Signup → OTP → Success.
 *
 * @param {boolean} visible         - Control modal visibility
 * @param {() => void} onClose      - Called when modal is dismissed
 * @param {'dark'|'light'} theme    - Color theme
 *
 * @example
 * const [showAuth, setShowAuth] = useState(false);
 * <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} theme="dark" />
 */
function AuthModal({
  visible,
  onClose,
  theme = 'dark'
}) {
  const {
    login,
    signup,
    verifyOtp,
    resendOtp,
    isAuthenticated
  } = useAuthEasy();
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
  const dark = theme !== 'light';
  const c = dark ? darkColors : lightColors;
  useEffect(() => {
    if (isAuthenticated && visible) onClose?.();
  }, [isAuthenticated]);
  useEffect(() => {
    if (!visible) {
      setMode('login');
      setForm({
        name: '',
        email: '',
        password: '',
        otp: ''
      });
      setStatus({
        loading: false,
        error: '',
        success: ''
      });
    }
  }, [visible]);
  const set = key => val => setForm(f => ({
    ...f,
    [key]: val
  }));
  const handleLogin = async () => {
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
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message,
        success: ''
      });
    }
  };
  const handleSignup = async () => {
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
        success: 'OTP bheja gaya! Email check karo.'
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
  const handleOtp = async () => {
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
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message,
        success: ''
      });
    }
  };
  const handleResend = async () => {
    try {
      await resendOtp({
        email: form.email
      });
      setStatus({
        loading: false,
        error: '',
        success: 'Code dubara bheja!'
      });
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message,
        success: ''
      });
    }
  };
  return /*#__PURE__*/React.createElement(Modal, {
    visible: visible,
    transparent: true,
    animationType: "slide",
    onRequestClose: onClose
  }, /*#__PURE__*/React.createElement(KeyboardAvoidingView, {
    style: [s.overlay, {
      backgroundColor: dark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)'
    }],
    behavior: Platform.OS === 'ios' ? 'padding' : 'height'
  }, /*#__PURE__*/React.createElement(ScrollView, {
    contentContainerStyle: s.scroll,
    keyboardShouldPersistTaps: "handled"
  }, /*#__PURE__*/React.createElement(View, {
    style: [s.card, {
      backgroundColor: c.card,
      borderColor: c.border
    }]
  }, /*#__PURE__*/React.createElement(TouchableOpacity, {
    style: s.closeBtn,
    onPress: onClose
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.closeText, {
      color: c.textMuted
    }]
  }, "\u2715")), /*#__PURE__*/React.createElement(View, {
    style: s.header
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.title, {
      color: c.title
    }]
  }, mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Verify Email'), /*#__PURE__*/React.createElement(Text, {
    style: [s.subtitle, {
      color: c.textMuted
    }]
  }, mode === 'otp' ? `${form.email} pe code bheja gaya` : mode === 'login' ? 'Sign in to continue' : 'Seconds mein join karo')), !!status.error && /*#__PURE__*/React.createElement(View, {
    style: [s.alert, {
      backgroundColor: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.3)'
    }]
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#f87171',
      fontSize: 13
    }
  }, status.error)), !!status.success && /*#__PURE__*/React.createElement(View, {
    style: [s.alert, {
      backgroundColor: 'rgba(34,197,94,0.12)',
      borderColor: 'rgba(34,197,94,0.3)'
    }]
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#4ade80',
      fontSize: 13
    }
  }, status.success)), mode === 'login' && /*#__PURE__*/React.createElement(View, {
    style: s.form
  }, /*#__PURE__*/React.createElement(RNField, {
    label: "Email",
    value: form.email,
    onChangeText: set('email'),
    keyboardType: "email-address",
    placeholder: "you@example.com",
    c: c
  }), /*#__PURE__*/React.createElement(RNField, {
    label: "Password",
    value: form.password,
    onChangeText: set('password'),
    secureTextEntry: true,
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    c: c
  }), /*#__PURE__*/React.createElement(RNButton, {
    loading: status.loading,
    onPress: handleLogin,
    c: c
  }, "Sign In"), /*#__PURE__*/React.createElement(View, {
    style: s.switchRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.switchText, {
      color: c.textMuted
    }]
  }, "Account nahi hai? "), /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: () => setMode('signup')
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.switchLink, {
      color: c.accent
    }]
  }, "Sign up")))), mode === 'signup' && /*#__PURE__*/React.createElement(View, {
    style: s.form
  }, /*#__PURE__*/React.createElement(RNField, {
    label: "Name",
    value: form.name,
    onChangeText: set('name'),
    placeholder: "John Doe",
    c: c
  }), /*#__PURE__*/React.createElement(RNField, {
    label: "Email",
    value: form.email,
    onChangeText: set('email'),
    keyboardType: "email-address",
    placeholder: "you@example.com",
    c: c
  }), /*#__PURE__*/React.createElement(RNField, {
    label: "Password",
    value: form.password,
    onChangeText: set('password'),
    secureTextEntry: true,
    placeholder: "Min 8 chars, @ use karo",
    c: c
  }), /*#__PURE__*/React.createElement(RNButton, {
    loading: status.loading,
    onPress: handleSignup,
    c: c
  }, "Create Account"), /*#__PURE__*/React.createElement(View, {
    style: s.switchRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.switchText, {
      color: c.textMuted
    }]
  }, "Account hai? "), /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: () => setMode('login')
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.switchLink, {
      color: c.accent
    }]
  }, "Sign in")))), mode === 'otp' && /*#__PURE__*/React.createElement(View, {
    style: s.form
  }, /*#__PURE__*/React.createElement(TextInput, {
    value: form.otp,
    onChangeText: set('otp'),
    placeholder: "\u2022 \u2022 \u2022 \u2022 \u2022 \u2022",
    keyboardType: "number-pad",
    maxLength: 6,
    placeholderTextColor: c.textMuted,
    style: [s.otpInput, {
      backgroundColor: c.input,
      borderColor: c.inputBorder,
      color: c.inputText
    }]
  }), /*#__PURE__*/React.createElement(RNButton, {
    loading: status.loading,
    onPress: handleOtp,
    c: c
  }, "Verify & Login"), /*#__PURE__*/React.createElement(View, {
    style: s.switchRow
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.switchText, {
      color: c.textMuted
    }]
  }, "Code nahi mila? "), /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: handleResend
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.switchLink, {
      color: c.accent
    }]
  }, "Resend karo")))), /*#__PURE__*/React.createElement(Text, {
    style: [s.poweredBy, {
      color: c.textMuted
    }]
  }, "Secured by", ' ', /*#__PURE__*/React.createElement(Text, {
    style: {
      color: c.accent,
      fontWeight: '700'
    }
  }, "AuthEasy"))))));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RNField({
  label,
  c,
  ...props
}) {
  return /*#__PURE__*/React.createElement(View, {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: [s.label, {
      color: c.label
    }]
  }, label), /*#__PURE__*/React.createElement(TextInput, _extends({
    placeholderTextColor: c.textMuted,
    style: [s.input, {
      backgroundColor: c.input,
      borderColor: c.inputBorder,
      color: c.inputText
    }],
    autoCapitalize: "none"
  }, props)));
}
function RNButton({
  loading,
  onPress,
  c,
  children
}) {
  return /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: onPress,
    disabled: loading,
    style: [s.btn, {
      backgroundColor: loading ? '#9ca3af' : c.accent
    }],
    activeOpacity: 0.8
  }, loading ? /*#__PURE__*/React.createElement(ActivityIndicator, {
    color: "#0f172a",
    size: "small"
  }) : /*#__PURE__*/React.createElement(Text, {
    style: s.btnText
  }, children));
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const darkColors = {
  card: '#111827',
  border: '#1f2937',
  input: '#1e293b',
  inputBorder: '#334155',
  inputText: '#f1f5f9',
  label: '#94a3b8',
  title: '#f8fafc',
  textMuted: '#6b7280',
  accent: '#c7a872'
};
const lightColors = {
  card: '#ffffff',
  border: '#e5e7eb',
  input: '#f9fafb',
  inputBorder: '#d1d5db',
  inputText: '#1f2937',
  label: '#4b5563',
  title: '#111827',
  textMuted: '#9ca3af',
  accent: '#c7a872'
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 28,
    paddingBottom: 40
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 8,
    zIndex: 1
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600'
  },
  header: {
    marginBottom: 20,
    marginTop: 8
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13
  },
  alert: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14
  },
  form: {
    gap: 0
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14
  },
  otpInput: {
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 16
  },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14
  },
  btnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  switchText: {
    fontSize: 13
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '700'
  },
  poweredBy: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 20
  }
});

export { AuthEasyProvider, AuthModal, useAuthEasy };
