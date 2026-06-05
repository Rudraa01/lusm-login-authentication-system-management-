import { Link } from 'react-router-dom';
import { Shield, Zap, Users, Code2, Lock, Mail, ArrowRight, ChevronRight } from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <Shield size={28} />,
    title: 'Secure Authentication',
    description: 'Industry-standard JWT tokens, bcrypt password hashing, and rate limiting built-in.',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  {
    icon: <Mail size={28} />,
    title: 'Email OTP Verification',
    description: 'Automatic OTP emails for signup verification and password resets. Zero setup required.',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  {
    icon: <Users size={28} />,
    title: 'User Management',
    description: 'View, search, block, or delete users from your dashboard. Full control over your user base.',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    icon: <Code2 size={28} />,
    title: 'Simple REST API',
    description: 'Clean, documented REST endpoints. Just add your API key header and start authenticating.',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
  {
    icon: <Lock size={28} />,
    title: 'CORS Protection',
    description: 'Whitelist your domains to prevent unauthorized use of your API keys.',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  },
  {
    icon: <Zap size={28} />,
    title: '100% Free',
    description: 'No hidden charges, no credit card required. Free authentication for every developer.',
    gradient: 'linear-gradient(135deg, #f43f5e, #f97316)',
  },
];

const codeExample = `// Register a user on your app
const response = await fetch('https://api.lusm.dev/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'lusm_a1b2c3d4_e5f6g7h8_i9j0k1l2'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    name: 'John Doe'
  })
});

const data = await response.json();
// { success: true, message: "OTP sent to email" }`;

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="logo-icon">🔐</div>
            <span className="logo-text">LUSM</span>
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#code">Integration</a>
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/signup" className="btn btn-primary">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-slide-up">
            <Zap size={14} />
            <span>Free Authentication API for Frontend Developers</span>
          </div>
          <h1 className="hero-title animate-slide-up">
            Add <span className="gradient-text">Authentication</span> to your
            app in <span className="gradient-text">minutes</span>
          </h1>
          <p className="hero-subtitle animate-slide-up">
            Stop building backends from scratch. Get a complete login system with 
            Email OTP, JWT tokens, and user management — just integrate our API.
          </p>
          <div className="hero-actions animate-slide-up">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start Building Free
              <ArrowRight size={18} />
            </Link>
            <a href="#code" className="btn btn-secondary btn-lg">
              View API Docs
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
              <span className="hero-stat-value">5 min</span>
              <span className="hero-stat-label">Integration Time</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">REST</span>
              <span className="hero-stat-label">Simple API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything you need for authentication</h2>
            <p className="section-subtitle">
              A complete auth solution so you can focus on building your frontend.
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
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">How it Works</span>
            <h2 className="section-title">Three simple steps to get started</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Create Account & Project</h3>
              <p>Sign up on LUSM, create a project, and get your unique API key instantly.</p>
            </div>
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Integrate the API</h3>
              <p>Use our REST endpoints in your frontend with just the API key in headers.</p>
            </div>
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Manage Users</h3>
              <p>View registrations, manage users, and monitor activity from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="code-section" id="code">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Integration</span>
            <h2 className="section-title">Integrate in just a few lines of code</h2>
            <p className="section-subtitle">
              No SDK needed. Just plain fetch or axios calls with your API key.
            </p>
          </div>
          <div className="code-block">
            <div className="code-block-header">
              <span>JavaScript / Fetch API</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(codeExample)}>
                Copy Code
              </button>
            </div>
            <pre><code>{codeExample}</code></pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to add authentication to your app?</h2>
          <p>Join LUSM and get your API key in under a minute. Completely free.</p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="nav-logo">
              <div className="logo-icon">🔐</div>
              <span className="logo-text">LUSM</span>
            </div>
            <p>Login User Service Management — Free Authentication API</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#code">Integration</a>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} LUSM. Made with ❤️ for frontend developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
