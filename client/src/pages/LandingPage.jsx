import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Shield, Zap, Users, Code2, Lock, Mail, ArrowRight, ChevronRight, Menu, X,
  Sparkles, Smartphone, Globe, Terminal, Copy, Check, Palette, Cpu, CheckCircle2,
  ExternalLink
} from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <Smartphone size={26} />,
    title: 'Multi-Platform SDKs',
    description: 'Official drop-in packages for React, Flutter, and React Native with native token persistence.',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  {
    icon: <Sparkles size={26} />,
    title: 'AI Vibe Coder Ready',
    description: 'Copy-paste prompts engineered for Cursor, Windsurf, & Claude that match your design system automatically.',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
  {
    icon: <Mail size={26} />,
    title: 'Instant Email OTP',
    description: 'Zero-config branded OTP emails for signup verification and password resets. Zero SMTP setup required.',
    gradient: 'linear-gradient(135deg, #475569, #5c6f84)',
  },
  {
    icon: <Shield size={26} />,
    title: 'Enterprise Security',
    description: 'Bcrypt password hashing, JWT access & refresh rotation, and rate-limiting to block brute-force attacks.',
    gradient: 'linear-gradient(135deg, #5c6f84, #70849c)',
  },
  {
    icon: <Users size={26} />,
    title: 'Developer Dashboard',
    description: 'Inspect active users, monitor auth events, revoke sessions, or block malicious users in real-time.',
    gradient: 'linear-gradient(135deg, #526355, #6b8270)',
  },
  {
    icon: <Zap size={26} />,
    title: '100% Free Forever',
    description: 'No credit card, no tier lockouts. Unlimited projects and free email OTP delivery for every developer.',
    gradient: 'linear-gradient(135deg, #8c7373, #a68a8a)',
  },
];

const codeTabs = [
  {
    id: 'react',
    label: 'React (Web)',
    icon: <Globe size={15} />,
    pkg: 'autheasy-react',
    install: 'npm install autheasy-react',
    code: `import { AuthEasyProvider, useAuthEasy } from 'autheasy-react';

// 1. Wrap your root application
export default function App() {
  return (
    <AuthEasyProvider apiKey="ae_live_8f3d12a9e04b7c">
      <Dashboard />
    </AuthEasyProvider>
  );
}

// 2. Use auth state & methods anywhere
function UserProfile() {
  const { user, login, logout, isAuthenticated, loading } = useAuthEasy();

  if (loading) return <div>Checking session...</div>;
  if (!isAuthenticated) {
    return <button onClick={() => login({ email, password })}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome back, {user.name}!</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}`,
  },
  {
    id: 'flutter',
    label: 'Flutter (Dart)',
    icon: <Smartphone size={15} />,
    pkg: 'autheasy_flutter',
    install: 'flutter pub add autheasy_flutter',
    code: `import 'package:flutter/material.dart';
import 'package:autheasy_flutter/autheasy_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Initialize once in main() with your API Key
  AuthEasy.initialize(apiKey: 'ae_live_8f3d12a9e04b7c');
  runApp(const MyApp());
}

// 2. Authenticate with automatic secure storage (JWT)
Future<void> handleLogin(String email, String password) async {
  final result = await AuthEasy.instance.login(
    email: email,
    password: password,
  );
  
  if (result.success) {
    print('Welcome, \${result.user?.name}!');
  }
}`,
  },
  {
    id: 'rn',
    label: 'React Native',
    icon: <Smartphone size={15} />,
    pkg: 'autheasy-react-native',
    install: 'npm install autheasy-react-native',
    code: `import React from 'react';
import { AuthEasyProvider, useAuthEasy } from 'autheasy-react-native';
import { View, Text, TouchableOpacity } from 'react-native';

// 1. Wrap your Expo / React Native root
export default function App() {
  return (
    <AuthEasyProvider apiKey="ae_live_8f3d12a9e04b7c">
      <HomeScreen />
    </AuthEasyProvider>
  );
}

// 2. Access state with mobile keychain/storage handled
function HomeScreen() {
  const { user, isAuthenticated, logout } = useAuthEasy();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{isAuthenticated ? \`Hi \${user.name}\` : 'Please Sign In'}</Text>
      {isAuthenticated && (
        <TouchableOpacity onPress={logout}>
          <Text>Log Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}`,
  },
  {
    id: 'curl',
    label: 'cURL / REST API',
    icon: <Terminal size={15} />,
    pkg: 'Universal HTTP',
    install: 'Base URL: https://api.autheasy.me/api/v1/auth',
    code: `# 1. Register a user (triggers automatic OTP verification email)
curl -X POST https://api.autheasy.me/api/v1/auth/register \\
  -H "x-api-key: ae_live_8f3d12a9e04b7c" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com","password":"Password@123"}'

# 2. Verify OTP & get back JWT tokens
curl -X POST https://api.autheasy.me/api/v1/auth/verify-otp \\
  -H "x-api-key: ae_live_8f3d12a9e04b7c" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"john@example.com","otp":"492817"}'

# Response: { success: true, data: { user, accessToken, refreshToken } }`,
  },
];

const sampleAiPrompt = `You are an expert full-stack engineer. Integrate AuthEasy authentication into my existing app.

Configuration:
- API Base URL: https://api.autheasy.me
- API Key: ae_live_8f3d12a9e04b7c
- Project ID: proj_99214

Tasks:
1. Examine my existing styles, colors, and layout patterns (Tailwind / CSS / Theme).
2. Build responsive Login, Signup, OTP Verification, and Forgot Password screens.
3. Enforce the strict password rule (min 8 chars, 1 uppercase, 1 lowercase, 1 number, exactly one '@').
4. Wire up all endpoints with header 'x-api-key' and store tokens securely.`;

export default function LandingPage() {
  const { developer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('react');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const currentTab = codeTabs.find((t) => t.id === activeCodeTab) || codeTabs[0];

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(sampleAiPrompt);
    setCopiedPrompt(true);
    toast.success('AI prompt copied to clipboard!');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
            <div className="logo-icon">
              <img src="/logo.png" alt="AuthEasy" className="logo-img" />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-links">
            <Link to="/templates">UI Templates</Link>
            <a href="#platforms">Platforms</a>
            <a href="#features">Features</a>
            <a href="#code">Integration</a>
            {developer ? (
              <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Login</Link>
                <Link to="/signup" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="mobile-nav-right">
            {!developer ? (
              <Link to="/signup" className="btn btn-primary mobile-quick-cta">
                Get Started
              </Link>
            ) : (
              <Link to="/dashboard" className="btn btn-primary mobile-quick-cta">
                Dashboard
              </Link>
            )}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer animate-slide-down">
            <Link
              to="/templates"
              className="mobile-nav-item"
              onClick={closeMobileMenu}
            >
              UI Templates
            </Link>
            <a href="#platforms" className="mobile-nav-item" onClick={closeMobileMenu}>
              Platforms
            </a>
            <a href="#features" className="mobile-nav-item" onClick={closeMobileMenu}>
              Features
            </a>
            <a href="#code" className="mobile-nav-item" onClick={closeMobileMenu}>
              Integration
            </a>

            <div className="mobile-menu-divider" />

            <div className="mobile-menu-cta-container">
              {developer ? (
                <Link to="/dashboard" className="btn btn-primary" onClick={closeMobileMenu}>
                  Go to Dashboard
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary" onClick={closeMobileMenu}>
                    Get Started Free
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" className="btn btn-ghost" onClick={closeMobileMenu} style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-effects">
          <div className="hero-grid" />
          <div className="hero-center-glow" />
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-slide-up">
            <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Official SDKs for React, Flutter & React Native • 100% Free</span>
          </div>
          <h1 className="hero-title animate-slide-up">
            Authentication built for <span className="gradient-text">speed</span>.<br />
            Ship in <span className="gradient-text">minutes</span>, not weeks.
          </h1>
          <p className="hero-subtitle animate-slide-up">
            Drop-in login, signup, and email OTP verification for Web, Flutter, React Native, and REST API.
            Zero backend setup required — built for developers and AI vibe coders.
          </p>
          <div className="hero-actions animate-slide-up">
            {developer ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/signup" className="btn btn-primary btn-lg">
                Start Building Free
                <ArrowRight size={18} />
              </Link>
            )}
            <a href="#code" className="btn btn-secondary btn-lg">
              Explore SDKs
              <ChevronRight size={18} />
            </a>
          </div>

          <div className="hero-stats animate-fade-in">
            <div className="hero-stat">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Free Forever</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">3+</span>
              <span className="hero-stat-label">Official SDKs</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">&lt; 5 min</span>
              <span className="hero-stat-label">Integration Time</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Zero</span>
              <span className="hero-stat-label">Backend Code</span>
            </div>
          </div>

          {/* Supported Platforms Bar */}
          <div className="hero-platforms-container animate-fade-in" id="platforms">
            <span className="hero-platforms-label">Supported Platforms & Official SDKs</span>
            <div className="hero-platforms-list">
              <div className="hero-platform-pill" onClick={() => setActiveCodeTab('react')} style={{ cursor: 'pointer' }}>
                <Globe size={15} style={{ color: '#818cf8' }} />
                <span>React / Web</span>
                <span className="hero-platform-tag">npm</span>
              </div>
              <div className="hero-platform-pill" onClick={() => setActiveCodeTab('flutter')} style={{ cursor: 'pointer' }}>
                <Smartphone size={15} style={{ color: '#06b6d4' }} />
                <span>Flutter</span>
                <span className="hero-platform-tag">pub.dev</span>
              </div>
              <div className="hero-platform-pill" onClick={() => setActiveCodeTab('rn')} style={{ cursor: 'pointer' }}>
                <Smartphone size={15} style={{ color: '#38bdf8' }} />
                <span>React Native</span>
                <span className="hero-platform-tag">Expo</span>
              </div>
              <div className="hero-platform-pill" onClick={() => setActiveCodeTab('curl')} style={{ cursor: 'pointer' }}>
                <Terminal size={15} style={{ color: '#c7bba9' }} />
                <span>REST API</span>
                <span className="hero-platform-tag">HTTP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Vibe Coder Section */}
      <section className="ai-vibe-section" id="ai-first">
        <div className="section-container">
          <div className="ai-vibe-grid">
            <div className="ai-vibe-content">
              <span className="section-badge">AI-First Developer Experience</span>
              <h2>Vibe code your entire auth UI in seconds</h2>
              <p>
                Don't waste hours writing boilerplate form handlers or styling login screens.
                AuthEasy generates pre-filled, production-ready AI prompts specifically tuned for
                <strong> Cursor, Windsurf, Claude Code, and ChatGPT</strong>.
              </p>

              <div className="ai-vibe-features">
                <div className="ai-vibe-feature-item">
                  <div className="ai-vibe-feature-icon">
                    <Palette size={18} />
                  </div>
                  <div className="ai-vibe-feature-text">
                    <h4>Theme & Design System Adaptive</h4>
                    <p>Instructs AI to inspect your existing Tailwind classes, CSS variables, or component styles so auth pages look 100% native to your app.</p>
                  </div>
                </div>

                <div className="ai-vibe-feature-item">
                  <div className="ai-vibe-feature-icon">
                    <Cpu size={18} />
                  </div>
                  <div className="ai-vibe-feature-text">
                    <h4>Framework-Native Architecture</h4>
                    <p>Generates idiomatic React hooks, Flutter StatefulWidget & SecureStorage, or React Native components tailored to your platform.</p>
                  </div>
                </div>

                <div className="ai-vibe-feature-item">
                  <div className="ai-vibe-feature-icon">
                    <Lock size={18} />
                  </div>
                  <div className="ai-vibe-feature-text">
                    <h4>Security Rules Pre-Engineered</h4>
                    <p>Enforces strict password policies, automated email OTP verification flow, and token persistence out-of-the-box.</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                {developer ? (
                  <Link to="/dashboard/projects" className="btn btn-primary">
                    Open AI Prompts in Dashboard
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <Link to="/signup" className="btn btn-primary">
                    Try with your Project
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>

            {/* Interactive Prompt Card */}
            <div className="ai-prompt-preview-window">
              <div className="ai-prompt-preview-header">
                <div className="ai-window-dots">
                  <div className="ai-window-dot red" />
                  <div className="ai-window-dot yellow" />
                  <div className="ai-window-dot green" />
                </div>
                <div className="ai-prompt-preview-title">
                  <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Cursor / Windsurf AI Prompt</span>
                </div>
                <button className="ai-prompt-copy-btn" onClick={handleCopyPrompt}>
                  {copiedPrompt ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="ai-prompt-preview-body">
                <code>
                  {sampleAiPrompt}
                </code>
              </pre>
              <div className="ai-prompt-preview-footer">
                <span>Auto-fills your Project API Key & Endpoints</span>
                <span style={{ color: '#06b6d4' }}>Ready for Cursor • Windsurf • Claude</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-bg-effects">
          <div className="features-grid-bg" />
          <div className="features-glow" />
        </div>
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything you need for authentication</h2>
            <p className="section-subtitle">
              A complete multi-platform auth solution so you can focus on building your core product.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                className="feature-card glass-card"
                key={index}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="feature-icon"
                  style={{ background: feature.gradient }}
                >
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-section" id="how-it-works">
        <div className="section-bg-effects">
          <div className="how-dot-bg" />
          <div className="how-glow-left" />
          <div className="how-glow-right" />
        </div>
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">How it Works</span>
            <h2 className="section-title">Three simple steps to launch auth</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Create Project & Get API Key</h3>
              <p>Sign up in 30 seconds and create a universal project. Your API key works across Web, Flutter, and Mobile.</p>
            </div>
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Install SDK or Prompt AI</h3>
              <p>Add our official SDK or copy the tailored AI prompt into Cursor/Windsurf to generate custom auth UI instantly.</p>
            </div>
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Manage Users & Scale</h3>
              <p>View signups, monitor auth activity, and manage your developers and end-users from the central dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Multi-Platform Code Playground */}
      <section className="code-section" id="code">
        <div className="section-bg-effects">
          <div className="code-pattern-bg" />
          <div className="code-glow" />
        </div>
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Integration</span>
            <h2 className="section-title">Integrate in just a few lines of code</h2>
            <p className="section-subtitle">
              Choose your platform. Drop in our official SDK or use raw REST endpoints with your API key.
            </p>
          </div>

          <div className="code-interactive-card">
            {/* Tabs Bar */}
            <div className="code-tabs-nav">
              {codeTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`code-tab-btn ${activeCodeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveCodeTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Package Install Banner */}
            <div className="code-snippet-meta">
              <div className="code-install-box">
                <span className="code-install-text">{currentTab.install}</span>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleCopyCode(currentTab.install)}
                  title="Copy command"
                >
                  <Copy size={12} />
                </button>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleCopyCode(currentTab.code)}
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Content */}
            <pre className="code-interactive-content">
              <code>{currentTab.code}</code>
            </pre>

            {/* Card Footer */}
            <div className="code-card-footer">
              <span>Looking for full API methods, props & complete examples?</span>
              {developer ? (
                <Link to="/dashboard/sdk-docs" className="code-docs-link">
                  <span>Explore Interactive SDK Docs</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link to="/signup" className="code-docs-link">
                  <span>Get API Key & View Docs</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-bg-effects">
          <div className="cta-grid-bg" />
          <div className="cta-glow" />
        </div>
        <div className="cta-content">
          <h2>Ready to add authentication to your app?</h2>
          <p>Join AuthEasy and get your universal API key in under a minute. Completely free forever.</p>
          {developer ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Go to Dashboard
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Free
              <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="nav-logo">
              <div className="logo-icon">
                <img src="/logo.png" alt="AuthEasy" className="logo-img" />
              </div>
            </div>
            <p>Production-grade authentication infrastructure for React, Flutter, React Native, and REST API.</p>
          </div>
          <div className="footer-links">
            <a href="#platforms">Platforms</a>
            <a href="#ai-first">AI Vibe Coder</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#code">Integration</a>
            <Link to="/templates">Templates</Link>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} AuthEasy. All rights reserved.</p>
            <div className="developer-credit">
              Developed by <a href="https://rudranshinc.dev" target="_blank" rel="noopener noreferrer">Rudransh Inc.</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
