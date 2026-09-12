import { useState } from 'react';
import { Copy, Check, Terminal, Package, Smartphone, Globe, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './DashboardPages.css';

const platforms = [
  { id: 'web', label: 'Web (React)', icon: <Globe size={18} />, color: '#818cf8', pkg: 'autheasy-react' },
  { id: 'flutter', label: 'Flutter', icon: <Smartphone size={18} />, color: '#06b6d4', pkg: 'autheasy_flutter' },
  { id: 'rn', label: 'React Native', icon: <Smartphone size={18} />, color: '#22d3ee', pkg: 'autheasy-react-native' },
];

function CopyBlock({ label, code, language = 'bash' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="sdk-code-block">
      {label && <div className="sdk-code-label">{label}</div>}
      <div className="sdk-code-wrapper">
        <pre className="sdk-code-content">{code}</pre>
        <button className="sdk-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ─── WEB DOCS ──────────────────────────────────────────────────────────────
function WebDocs() {
  return (
    <div className="sdk-sections">
      <section className="sdk-section">
        <h3 className="sdk-section-title">Installation</h3>
        <CopyBlock code="npm install autheasy-react" />
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Quick Start — 3 Steps</h3>
        
        <div className="sdk-step">
          <span className="sdk-step-num">1</span>
          <span className="sdk-step-label">Wrap your app</span>
        </div>
        <CopyBlock label="main.jsx" language="jsx" code={`import { AuthEasyProvider } from 'autheasy-react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthEasyProvider apiKey="YOUR_API_KEY">
    <App />
  </AuthEasyProvider>
);`} />

        <div className="sdk-step">
          <span className="sdk-step-num">2</span>
          <span className="sdk-step-label">Use the hook anywhere</span>
        </div>
        <CopyBlock label="MyComponent.jsx" language="jsx" code={`import { useAuthEasy } from 'autheasy-react';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthEasy();

  if (!isAuthenticated) {
    return <button onClick={() => login({ email: '...', password: '...' })}>Login</button>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}`} />

        <div className="sdk-step">
          <span className="sdk-step-num">3</span>
          <span className="sdk-step-label">Or use the drop-in Auth Button (optional)</span>
        </div>
        <CopyBlock label="App.jsx" language="jsx" code={`import { AuthButton } from 'autheasy-react';

// Adds a button that opens a complete login/signup modal
<AuthButton theme="dark" buttonText="Sign In / Register" />`} />
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">All Available Methods</h3>
        <div className="sdk-api-table">
          <div className="sdk-api-row sdk-api-header">
            <span>Method</span><span>Description</span>
          </div>
          {[
            ['signup({ email, password, name })', 'Register new user → sends OTP email'],
            ['verifyOtp({ email, otp })', 'Verify OTP → auto logs in'],
            ['resendOtp({ email })', 'Resend OTP code'],
            ['login({ email, password })', 'Login → saves session automatically'],
            ['logout()', 'Clear session'],
            ['forgotPassword({ email })', 'Send password reset OTP'],
            ['resetPassword({ email, otp, newPassword })', 'Reset password with OTP'],
            ['getAccessToken()', 'Get raw JWT for your own API calls'],
          ].map(([m, d]) => (
            <div className="sdk-api-row" key={m}>
              <code>{m}</code><span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Protected Routes</h3>
        <CopyBlock language="jsx" code={`import { Navigate } from 'react-router-dom';
import { useAuthEasy } from 'autheasy-react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthEasy();
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Usage in router:
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />`} />
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Using Token for Your API Calls</h3>
        <CopyBlock language="jsx" code={`const { getAccessToken } = useAuthEasy();

const fetchData = async () => {
  const token = getAccessToken();
  const res = await fetch('https://my-backend.com/api/data', {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return res.json();
};`} />
      </section>
    </div>
  );
}

// ─── FLUTTER DOCS ──────────────────────────────────────────────────────────
function FlutterDocs() {
  return (
    <div className="sdk-sections">
      <section className="sdk-section">
        <h3 className="sdk-section-title">Installation</h3>
        <CopyBlock code="flutter pub add autheasy_flutter" />
        <p className="sdk-note">Also required: <code>flutter_secure_storage</code> (auto-installed as dependency)</p>
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Quick Start — 3 Steps</h3>
        
        <div className="sdk-step">
          <span className="sdk-step-num">1</span>
          <span className="sdk-step-label">Wrap your app</span>
        </div>
        <CopyBlock label="main.dart" language="dart" code={`import 'package:flutter/material.dart';
import 'package:autheasy_flutter/autheasy_flutter.dart';

void main() {
  runApp(
    AuthEasyProvider(
      apiKey: 'YOUR_API_KEY',
      child: const MyApp(),
    ),
  );
}`} />

        <div className="sdk-step">
          <span className="sdk-step-num">2</span>
          <span className="sdk-step-label">Access auth state in any screen</span>
        </div>
        <CopyBlock label="home_screen.dart" language="dart" code={`import 'package:autheasy_flutter/autheasy_flutter.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final auth = AuthEasyProvider.watch(context);

    if (auth.loading) return const CircularProgressIndicator();

    if (!auth.isAuthenticated) {
      return ElevatedButton(
        onPressed: () => showAuthModal(context),
        child: const Text('Sign In'),
      );
    }

    return Column(children: [
      Text('Welcome, \${auth.user!.name}!'),
      ElevatedButton(onPressed: () => auth.logout(), child: const Text('Logout')),
    ]);
  }
}`} />

        <div className="sdk-step">
          <span className="sdk-step-num">3</span>
          <span className="sdk-step-label">Or use drop-in widgets (optional)</span>
        </div>
        <CopyBlock label="Any Screen" language="dart" code={`// Option A: Show auth modal
showAuthModal(context, isDark: true);

// Option B: Use AuthButton widget
AuthButton(
  label: 'Sign In / Register',
  theme: AuthButtonTheme.dark,
)`} />
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">All Available Methods</h3>
        <div className="sdk-api-table">
          <div className="sdk-api-row sdk-api-header">
            <span>Method</span><span>Description</span>
          </div>
          {[
            ['login(email, password)', 'Login → saves session via FlutterSecureStorage'],
            ['signup(email, password, name?)', 'Register → sends OTP email'],
            ['verifyOtp(email, otp)', 'Verify OTP → auto login'],
            ['resendOtp(email)', 'Resend OTP'],
            ['logout()', 'Clear session'],
            ['forgotPassword(email)', 'Send reset OTP'],
            ['resetPassword(email, otp, newPassword)', 'Reset password'],
            ['getAccessToken()', 'Get JWT (async → Future<String?>)'],
          ].map(([m, d]) => (
            <div className="sdk-api-row" key={m}>
              <code>{m}</code><span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Custom Login Screen</h3>
        <CopyBlock language="dart" code={`class LoginScreen extends StatefulWidget { ... }

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  Future<void> _login() async {
    final auth = AuthEasyProvider.of(context);
    try {
      await auth.login(email: _emailCtrl.text, password: _passwordCtrl.text);
      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Column(children: [
      TextField(controller: _emailCtrl, decoration: InputDecoration(labelText: 'Email')),
      TextField(controller: _passwordCtrl, obscureText: true, decoration: InputDecoration(labelText: 'Password')),
      ElevatedButton(onPressed: _login, child: Text('Login')),
    ]));
  }
}`} />
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Protecting Screens</h3>
        <CopyBlock language="dart" code={`class ProtectedScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final auth = AuthEasyProvider.watch(context);
    
    if (auth.loading) return Scaffold(body: Center(child: CircularProgressIndicator()));
    if (!auth.isAuthenticated) return LoginScreen();
    
    return Scaffold(body: Center(child: Text('Welcome \${auth.user!.name}!')));
  }
}`} />
      </section>
    </div>
  );
}

// ─── REACT NATIVE DOCS ─────────────────────────────────────────────────────
function ReactNativeDocs() {
  return (
    <div className="sdk-sections">
      <section className="sdk-section">
        <h3 className="sdk-section-title">Installation</h3>
        <CopyBlock code={`npm install autheasy-react-native
npm install @react-native-async-storage/async-storage`} />
        <p className="sdk-note">For iOS, also run: <code>npx pod-install</code></p>
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Quick Start — 3 Steps</h3>
        
        <div className="sdk-step">
          <span className="sdk-step-num">1</span>
          <span className="sdk-step-label">Wrap your app</span>
        </div>
        <CopyBlock label="App.js" language="jsx" code={`import { AuthEasyProvider } from 'autheasy-react-native';

export default function App() {
  return (
    <AuthEasyProvider apiKey="YOUR_API_KEY">
      <NavigationContainer>
        {/* your screens */}
      </NavigationContainer>
    </AuthEasyProvider>
  );
}`} />

        <div className="sdk-step">
          <span className="sdk-step-num">2</span>
          <span className="sdk-step-label">Use the hook in any screen</span>
        </div>
        <CopyBlock label="HomeScreen.js" language="jsx" code={`import { useAuthEasy } from 'autheasy-react-native';

function HomeScreen() {
  const { user, isAuthenticated, logout } = useAuthEasy();

  if (!isAuthenticated) return <Text>Please login</Text>;

  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}`} />

        <div className="sdk-step">
          <span className="sdk-step-num">3</span>
          <span className="sdk-step-label">Or use the drop-in Auth Modal (optional)</span>
        </div>
        <CopyBlock label="LoginScreen.js" language="jsx" code={`import { useState } from 'react';
import { AuthModal } from 'autheasy-react-native';

function LoginScreen() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <View>
      <Button title="Sign In" onPress={() => setShowAuth(true)} />
      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} theme="dark" />
    </View>
  );
}`} />
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">All Available Methods</h3>
        <div className="sdk-api-table">
          <div className="sdk-api-row sdk-api-header">
            <span>Method</span><span>Description</span>
          </div>
          {[
            ['signup({ email, password, name })', 'Register → sends OTP email'],
            ['verifyOtp({ email, otp })', 'Verify OTP → auto login'],
            ['resendOtp({ email })', 'Resend OTP'],
            ['login({ email, password })', 'Login → saves session (AsyncStorage)'],
            ['logout()', 'Clear session'],
            ['forgotPassword({ email })', 'Send reset OTP'],
            ['resetPassword({ email, otp, newPassword })', 'Reset password'],
            ['getAccessToken()', 'Get JWT (async → Promise<string>)'],
          ].map(([m, d]) => (
            <div className="sdk-api-row" key={m}>
              <code>{m}</code><span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Custom Login Screen</h3>
        <CopyBlock language="jsx" code={`import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useAuthEasy } from 'autheasy-react-native';

function MyLoginScreen({ navigation }) {
  const { login } = useAuthEasy();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await login({ email, password });
      navigation.replace('Home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={{ padding: 24 }}>
      {!!error && <Text style={{ color: 'red' }}>{error}</Text>}
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}`} />
      </section>

      <section className="sdk-section">
        <h3 className="sdk-section-title">Using Token for Your API Calls</h3>
        <CopyBlock language="jsx" code={`const { getAccessToken } = useAuthEasy();

const fetchData = async () => {
  const token = await getAccessToken(); // Note: async in React Native
  const res = await fetch('https://my-backend.com/api/data', {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return res.json();
};`} />
        <p className="sdk-note">⚠️ <code>getAccessToken()</code> is <strong>async</strong> in React Native (uses AsyncStorage), unlike the web SDK.</p>
      </section>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function SdkDocsPage() {
  const [platform, setPlatform] = useState('web');
  const current = platforms.find((p) => p.id === platform);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">SDK Documentation</h1>
          <p className="page-subtitle">
            Install our SDK and add authentication to your app in minutes
          </p>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="sdk-platform-tabs">
        {platforms.map((p) => (
          <button
            key={p.id}
            className={`sdk-platform-tab ${platform === p.id ? 'active' : ''}`}
            onClick={() => setPlatform(p.id)}
            style={{ '--tab-accent': p.color }}
          >
            {p.icon}
            <span>{p.label}</span>
            {platform === p.id && <ChevronRight size={14} className="sdk-tab-arrow" />}
          </button>
        ))}
      </div>

      {/* Package Info Banner */}
      <div className="sdk-package-banner glass-card">
        <div className="sdk-package-info">
          <Package size={18} style={{ color: current.color }} />
          <code style={{ color: current.color, fontSize: 15 }}>{current.pkg}</code>
        </div>
        <div className="sdk-package-links">
          <a
            href={current.id === 'flutter'
              ? `https://pub.dev/packages/${current.pkg}`
              : `https://www.npmjs.com/package/${current.pkg}`}
            target="_blank"
            rel="noreferrer"
            className="sdk-package-link"
          >
            {current.id === 'flutter' ? 'pub.dev' : 'npmjs.com'} →
          </a>
        </div>
      </div>

      {/* Password Policy Note */}
      <div className="sdk-password-note glass-card">
        <h4 style={{ color: 'var(--accent-amber)', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
          🔐 Password Policy
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          Min <strong>8 chars</strong> • 1 <strong>uppercase</strong> • 1 <strong>lowercase</strong> • 1 <strong>number</strong> • exactly 1 <strong>@</strong> symbol.
          Example: <code style={{ color: 'var(--accent-cyan)' }}>MyPass@123</code>
        </p>
      </div>

      {/* Platform Content */}
      {platform === 'web' && <WebDocs />}
      {platform === 'flutter' && <FlutterDocs />}
      {platform === 'rn' && <ReactNativeDocs />}
    </div>
  );
}
