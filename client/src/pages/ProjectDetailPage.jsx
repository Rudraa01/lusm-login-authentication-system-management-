import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Key, Copy, Eye, EyeOff, RefreshCw, Users,
  Shield, Trash2, Ban, CheckCircle, Search, Loader2, Edit2, Mail, Sparkles, X,
  Globe, Smartphone, Terminal, Check, ExternalLink
} from 'lucide-react';
import './DashboardPages.css';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('users');
  const [origins, setOrigins] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState('web');
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/api/dash/projects/${id}`);
      setProject(res.data.data);
      setOrigins(res.data.data.allowedOrigins || '');
      setLogoUrl(res.data.data.logoUrl || '');
    } catch (err) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const res = await api.get(`/api/dash/projects/${id}/users?page=${page}&search=${search}`);
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  const copyApiKey = () => {
    if (project) {
      navigator.clipboard.writeText(project.apiKey);
      toast.success('API key copied!');
    }
  };

  const regenerateKey = async () => {
    if (!confirm('Are you sure? All existing integrations using the current key will stop working.')) return;
    try {
      const res = await api.post(`/api/dash/projects/${id}/regenerate-key`);
      setProject({ ...project, apiKey: res.data.data.apiKey });
      toast.success('API key regenerated!');
    } catch (err) {
      toast.error('Failed to regenerate key');
    }
  };

  const saveSettings = async () => {
    try {
      const res = await api.put(`/api/dash/projects/${id}`, {
        logoUrl,
        allowedOrigins: origins
      });
      setProject({ 
        ...project, 
        logoUrl: res.data.data.logoUrl, 
        allowedOrigins: res.data.data.allowedOrigins 
      });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const toggleBlock = async (userId, isBlocked) => {
    try {
      await api.patch(`/api/dash/projects/${id}/users/${userId}/block`, {
        isBlocked: !isBlocked,
      });
      setUsers(users.map((u) => (u.id === userId ? { ...u, isBlocked: !isBlocked } : u)));
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/api/dash/projects/${id}/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const resetUserPassword = async (userId, isEmail) => {
    let newPassword = null;

    if (!isEmail) {
      newPassword = window.prompt("Enter new password for this user (min 8 chars, 1 uppercase, 1 lowercase, 1 number, exactly 1 @):");
      if (!newPassword) return;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*@)[A-Za-z0-9@]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        toast.error('Password must be min 8 chars, 1 uppercase, 1 lowercase, 1 number, exactly 1 @ symbol');
        return;
      }
    } else {
      if (!window.confirm("Are you sure you want to generate and email a new password?")) return;
    }

    try {
      const res = await api.put(`/api/dash/projects/${id}/users/${userId}/reset-password`, { 
        newPassword,
        generateAndEmail: isEmail
      });
      toast.success(res.data.message || 'User password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: 24 }}>
        <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 120, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 300 }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state">
        <h3>Project not found</h3>
        <Link to="/dashboard/projects" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/dashboard/projects" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', overflow: 'hidden', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}>
              {project.logoUrl ? (
                <img src={project.logoUrl} alt={project.name} style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              ) : null}
              <Shield size={24} style={{ display: project.logoUrl ? 'none' : 'block', color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h1 className="page-title">{project.name}</h1>
              {project.description && <p className="page-subtitle">{project.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* API Key Card */}
      <div className="glass-card api-key-card">
        <div className="api-key-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-white)' }}>API Key</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={copyApiKey}>
              <Copy size={14} /> Copy
            </button>
            <button className="btn btn-ghost btn-sm" onClick={regenerateKey} style={{ color: 'var(--accent-amber)' }}>
              <RefreshCw size={14} /> Regenerate
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPromptModal(true)} style={{ color: 'var(--accent-cyan)' }}>
              <Sparkles size={14} /> AI Prompts
            </button>
          </div>
        </div>
        <div className="api-key-value">
          <code>{showKey ? project.apiKey : '•'.repeat(20) + project.apiKey.slice(-8)}</code>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          <Users size={16} /> Users ({project.userCount})
        </button>
        <button
          className={`detail-tab ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
        >
          <Shield size={16} /> Security Settings
        </button>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="glass-card" style={{ marginTop: 20, overflow: 'hidden' }}>
          <div className="table-toolbar">
            <div className="input-with-icon" style={{ maxWidth: 300 }}>
              <Search size={18} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          {users.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <Users size={36} />
              <h3>No users yet</h3>
              <p>Users will appear here when they register through your API.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Email</th>
                    <th>Contact No.</th>
                    <th>Name</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className={expandedUser === user.id ? 'active-row' : ''}>
                        <td>
                          {user.isBlocked ? (
                            <span className="badge badge-danger">Blocked</span>
                          ) : user.isVerified ? (
                            <span className="badge badge-success">Verified</span>
                          ) : (
                            <span className="badge badge-warning">Unverified</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {user.email}
                        </td>
                        <td>{user.phone || '—'}</td>
                        <td>{user.name || '—'}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-icon btn-secondary-soft"
                            title="Edit User Actions"
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          >
                            <Edit2 size={14} />
                          </button>
                        </td>
                      </tr>
                      {expandedUser === user.id && (
                        <tr style={{ backgroundColor: 'var(--bg-glass-hover)', borderTop: 'none' }}>
                          <td colSpan="6" style={{ padding: '12px 24px', borderTop: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div className="action-row-content" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: 'auto' }}>
                                Manage End-User
                              </span>
                              <button
                                className="btn btn-sm btn-primary-soft"
                                onClick={() => resetUserPassword(user.id, true)}
                              >
                                <Mail size={14} /> Send Password
                              </button>
                              <button
                                className="btn btn-sm btn-secondary-soft"
                                onClick={() => resetUserPassword(user.id, false)}
                              >
                                <Key size={14} /> Set Password
                              </button>
                              <button
                                className={`btn btn-sm ${user.isBlocked ? 'btn-success-soft' : 'btn-warning-soft'}`}
                                onClick={() => toggleBlock(user.id, user.isBlocked)}
                              >
                                {user.isBlocked ? <><CheckCircle size={14} /> Unblock User</> : <><Ban size={14} /> Block User</>}
                              </button>
                              <button
                                className="btn btn-sm btn-danger-soft"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 size={14} /> Delete User
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="table-pagination">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => fetchUsers(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="glass-card settings-card" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Logo URL Section */}
          <div>
            <h3 style={{ color: 'var(--text-white)', marginBottom: 8, fontWeight: 700 }}>
              Project Logo
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              Specify a direct URL to your project's logo image. This logo will be displayed at the top of all transactional email notifications (like verification OTPs and password resets) sent to your end-users.
            </p>
            <div className="settings-logo-preview" style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)', overflow: 'hidden', flexShrink: 0 }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                ) : null}
                <span style={{ display: logoUrl ? 'none' : 'block', fontSize: 12, color: 'var(--text-muted)' }}>No Logo</span>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: '6px' }}>Project Logo URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://yourdomain.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

          {/* CORS Origins Section */}
          <div>
            <h3 style={{ color: 'var(--text-white)', marginBottom: 8, fontWeight: 700 }}>
              CORS — Allowed Origins
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              Only requests from these origins will be accepted. Separate multiple origins with commas.
              Leave empty to allow all origins (not recommended for production).
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                className="form-input"
                placeholder="https://local.dev:3000, https://myapp.com"
                value={origins}
                onChange={(e) => setOrigins(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <button className="btn btn-primary" onClick={saveSettings}>
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* AI Prompts Modal */}
      {showPromptModal && (
        <div className="ai-prompt-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="ai-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-prompt-modal-header">
              <div className="ai-prompt-modal-title">
                <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span>AI Developer Prompts & SDK Setup</span>
              </div>
              <button className="ai-prompt-modal-close" onClick={() => setShowPromptModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="ai-prompt-modal-body">
              {/* Platform Selector Tabs */}
              <div className="ai-prompt-tabs-container">
                <button
                  className={`ai-prompt-tab-btn ${activePromptTab === 'web' ? 'active' : ''}`}
                  onClick={() => setActivePromptTab('web')}
                >
                  <Globe size={15} />
                  <span>Web (React)</span>
                </button>
                <button
                  className={`ai-prompt-tab-btn ${activePromptTab === 'flutter' ? 'active' : ''}`}
                  onClick={() => setActivePromptTab('flutter')}
                >
                  <Smartphone size={15} />
                  <span>Flutter</span>
                </button>
                <button
                  className={`ai-prompt-tab-btn ${activePromptTab === 'rn' ? 'active' : ''}`}
                  onClick={() => setActivePromptTab('rn')}
                >
                  <Smartphone size={15} />
                  <span>React Native</span>
                </button>
                <button
                  className={`ai-prompt-tab-btn ${activePromptTab === 'api' ? 'active' : ''}`}
                  onClick={() => setActivePromptTab('api')}
                >
                  <Terminal size={15} />
                  <span>REST API</span>
                </button>
              </div>

              {/* Step 1: Install (for SDK platforms) */}
              {activePromptTab !== 'api' && (
                <div className="ai-prompt-step">
                  <div className="ai-prompt-step-header">
                    <span className="ai-prompt-step-num">1</span>
                    <span className="ai-prompt-step-title">Install Official Package</span>
                  </div>
                  <div className="ai-prompt-snippet-box">
                    <span className="ai-prompt-snippet-code">
                      {activePromptTab === 'web' && 'npm install autheasy-react'}
                      {activePromptTab === 'flutter' && 'flutter pub add autheasy_flutter'}
                      {activePromptTab === 'rn' && 'npm install autheasy-react-native'}
                    </span>
                    <button
                      className="ai-prompt-copy-sm-btn"
                      onClick={() =>
                        copyToClipboard(
                          activePromptTab === 'web'
                            ? 'npm install autheasy-react'
                            : activePromptTab === 'flutter'
                            ? 'flutter pub add autheasy_flutter'
                            : 'npm install autheasy-react-native',
                          'install'
                        )
                      }
                    >
                      {copiedSnippet === 'install' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedSnippet === 'install' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Quick Start Code */}
              <div className="ai-prompt-step">
                <div className="ai-prompt-step-header">
                  <span className="ai-prompt-step-num">{activePromptTab === 'api' ? '1' : '2'}</span>
                  <span className="ai-prompt-step-title">
                    {activePromptTab === 'api' ? 'Quick Request Test' : 'Quick Provider / Init Setup'}
                  </span>
                </div>
                <div className="ai-prompt-snippet-box" style={{ alignItems: 'flex-start' }}>
                  <pre
                    className="ai-prompt-snippet-code"
                    style={{ margin: 0, padding: '2px 0', lineHeight: 1.5 }}
                  >
                    {activePromptTab === 'web' &&
`import { AuthEasyProvider } from 'autheasy-react';

<AuthEasyProvider apiKey="${project?.apiKey}">
  <App />
</AuthEasyProvider>`}
                    {activePromptTab === 'flutter' &&
`import 'package:autheasy_flutter/autheasy_flutter.dart';

void main() {
  AuthEasy.initialize(apiKey: '${project?.apiKey}');
  runApp(const MyApp());
}`}
                    {activePromptTab === 'rn' &&
`import { AuthEasyProvider } from 'autheasy-react-native';

export default function App() {
  return (
    <AuthEasyProvider apiKey="${project?.apiKey}">
      <MainApp />
    </AuthEasyProvider>
  );
}`}
                    {activePromptTab === 'api' &&
`curl -X POST ${window.location.origin}/api/v1/auth/login \\
  -H "x-api-key: ${project?.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"Password@123"}'`}
                  </pre>
                  <button
                    className="ai-prompt-copy-sm-btn"
                    onClick={() => {
                      const snippet =
                        activePromptTab === 'web'
                          ? `import { AuthEasyProvider } from 'autheasy-react';\n\n<AuthEasyProvider apiKey="${project?.apiKey}">\n  <App />\n</AuthEasyProvider>`
                          : activePromptTab === 'flutter'
                          ? `import 'package:autheasy_flutter/autheasy_flutter.dart';\n\nvoid main() {\n  AuthEasy.initialize(apiKey: '${project?.apiKey}');\n  runApp(const MyApp());\n}`
                          : activePromptTab === 'rn'
                          ? `import { AuthEasyProvider } from 'autheasy-react-native';\n\nexport default function App() {\n  return (\n    <AuthEasyProvider apiKey="${project?.apiKey}">\n      <MainApp />\n    </AuthEasyProvider>\n  );\n}`
                          : `curl -X POST ${window.location.origin}/api/v1/auth/login \\\n  -H "x-api-key: ${project?.apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"user@example.com","password":"Password@123"}'`;
                      copyToClipboard(snippet, 'init');
                    }}
                  >
                    {copiedSnippet === 'init' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedSnippet === 'init' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Step 3: Vibe Coder AI Prompt */}
              <div className="ai-prompt-step">
                <div className="ai-prompt-step-header">
                  <span className="ai-prompt-step-num">{activePromptTab === 'api' ? '2' : '3'}</span>
                  <span className="ai-prompt-step-title">
                    Vibe Coder AI Prompt (Cursor / Windsurf / Claude / ChatGPT)
                  </span>
                </div>
                <p className="ai-prompt-desc" style={{ margin: 0, padding: '10px 14px' }}>
                  {activePromptTab === 'web' && 'Paste this prompt in your AI code editor to build a fully styled React login, signup, and OTP verification flow.'}
                  {activePromptTab === 'flutter' && 'Paste this prompt in your AI editor to generate complete Flutter auth screens with local secure storage and clean widgets.'}
                  {activePromptTab === 'rn' && 'Paste this prompt in your AI editor to create mobile-first React Native auth screens with keyboard handling and token storage.'}
                  {activePromptTab === 'api' && 'Paste this prompt to create a production-ready HTTP auth helper for any framework or backend language.'}
                </p>

                <div className="ai-prompt-code-wrapper">
                  <div className="ai-prompt-code-header">
                    <span>{activePromptTab.toUpperCase()} Integration Prompt</span>
                    <span>Markdown</span>
                  </div>
                  <pre className="ai-prompt-code-content">
                    {activePromptTab === 'web' &&
`You are a senior React engineer and AI agent coder. I want to build a complete authentication flow (Login, Sign Up, OTP Verification, Forgot Password, and Reset Password) in my existing React application using AuthEasy.

Configuration:
- **API Base URL**: ${window.location.origin}
- **API Key**: ${project?.apiKey}
- **Project ID**: ${project?.id}
- **Recommended SDK**: \`autheasy-react\` (npm)

Password Policy (Strict backend requirement):
The backend validates that all passwords must:
1. Be at least 8 characters long
2. Contain at least 1 uppercase letter (A-Z)
3. Contain at least 1 lowercase letter (a-z)
4. Contain at least 1 number (0-9)
5. Contain exactly one '@' symbol (no other special characters allowed!)
Example valid password: "MyPassword@123"

Tasks:
1. Wrap root with \`<AuthEasyProvider apiKey="${project?.apiKey}">\`.
2. Inspect the existing app design system (Tailwind CSS, CSS variables, components) to match its exact aesthetic.
3. Build responsive auth components:
   - **Login Screen**: email & password fields, forgot password link, loading spinner.
   - **Sign Up Screen**: name, email, password with live password checklist (8+ chars, uppercase, lowercase, number, single '@').
   - **OTP Verification Screen**: 6-digit verification code input with auto-advance and countdown resend timer.
   - **Forgot / Reset Password Screens**: email step followed by OTP + new password step.
4. Hook Integration: Use \`const { user, login, signup, verifyOtp, forgotPassword, resetPassword, logout, loading, error } = useAuthEasy();\` to wire up all actions.`}

                    {activePromptTab === 'flutter' &&
`You are a senior Flutter mobile engineer and AI agent coder. I want to build a complete, production-grade mobile authentication flow in my Flutter application using AuthEasy.

Configuration:
- **API Base URL**: ${window.location.origin}
- **API Key**: ${project?.apiKey}
- **Project ID**: ${project?.id}
- **Recommended Package**: \`autheasy_flutter\` (or HTTP/Dio with \`flutter_secure_storage\`)

Password Policy (Strictly validated by AuthEasy backend):
Passwords must have at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and exactly one '@' symbol (no other symbols). Example: "FlutterApp@2026".

Tasks:
1. Initialize in \`main.dart\`: \`AuthEasy.initialize(apiKey: '${project?.apiKey}')\` or configure an \`AuthService\` singleton.
2. Match the app's existing ThemeData (colors, fonts, border radii, dark/light theme).
3. Build complete screens with smooth transitions and loading states:
   - **LoginScreen**: Email & password inputs, toggleable obscureText eye icon, forgot password button, error snackbars.
   - **SignUpScreen**: Full name, email, password input with dynamic requirement checklist (8+ chars, 1 uppercase, 1 lowercase, 1 number, single '@').
   - **OtpVerificationScreen**: 6-digit PIN input with auto-verification and 60-second resend countdown timer.
   - **ForgotPasswordScreen & ResetPasswordScreen**: Request OTP to email, then input OTP + new password.
4. Token Storage: Save JWT tokens securely using \`flutter_secure_storage\`. Provide an AuthState notifier managing \`isAuthenticated\`, \`currentUser\`, and auto-login on app launch.`}

                    {activePromptTab === 'rn' &&
`You are a senior React Native / Expo developer and AI agent coder. I want to build a complete native mobile authentication flow in my React Native application using AuthEasy.

Configuration:
- **API Base URL**: ${window.location.origin}
- **API Key**: ${project?.apiKey}
- **Project ID**: ${project?.id}
- **Recommended Package**: \`autheasy-react-native\` (or Axios with \`expo-secure-store\` / AsyncStorage)

Strict Password Policy:
Passwords must: be min 8 characters, include 1 uppercase, 1 lowercase, 1 digit, and exactly one '@' symbol. Example: "ReactNative@77".

Tasks:
1. Wrap root app with \`<AuthEasyProvider apiKey="${project?.apiKey}">\`.
2. Analyze styling setup (NativeWind / Tailwind, StyleSheet, React Native Paper, or custom theme) and adopt the exact same patterns.
3. Build native mobile screens:
   - **LoginScreen**: Email and password inputs, show/hide password toggle, forgot password link, loading spinner.
   - **SignUpScreen**: Name, email, password with live validation checklist.
   - **OtpScreen**: 6 individual digit input boxes with auto-focus next on type and backspace support.
   - **ResetPasswordScreen**: Enter OTP and new password with validation.
4. Wrap screens with \`KeyboardAvoidingView\` for clean keyboard dismiss. Persist tokens securely using \`expo-secure-store\` or \`@react-native-async-storage/async-storage\`.
5. Expose \`useAuth()\` hook with \`{ user, login, signup, verifyOtp, forgotPassword, resetPassword, logout, loading }\`.`}

                    {activePromptTab === 'api' &&
`You are an expert backend and API integration engineer. I want to integrate authentication into my application using the AuthEasy REST API.

Configuration:
- **Base URL**: ${window.location.origin}
- **API Key**: ${project?.apiKey}
- **Project ID**: ${project?.id}
- **Required Header**: \`x-api-key: ${project?.apiKey}\`
- **Content-Type**: \`application/json\`

Backend Password Rule:
Passwords must have at least 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 digit, and exactly one '@' symbol (no other special symbols allowed).

API Endpoints:
1. User Registration: POST \`${window.location.origin}/api/v1/auth/register\`
   Body: \`{ "name": "...", "email": "...", "password": "...", "contactNumber": "..." }\`
2. Verify OTP: POST \`${window.location.origin}/api/v1/auth/verify-otp\`
   Body: \`{ "email": "...", "otp": "..." }\`
   Response: \`{ "success": true, "data": { "user": { "id": "...", "email": "...", "name": "..." }, "accessToken": "...", "refreshToken": "..." } }\`
3. User Login: POST \`${window.location.origin}/api/v1/auth/login\`
   Body: \`{ "email": "...", "password": "..." }\`
   Response: \`{ "success": true, "data": { "user": { ... }, "accessToken": "...", "refreshToken": "..." } }\`
4. Forgot Password: POST \`${window.location.origin}/api/v1/auth/forgot-password\`
   Body: \`{ "email": "..." }\`
5. Reset Password: POST \`${window.location.origin}/api/v1/auth/reset-password\`
   Body: \`{ "email": "...", "otp": "...", "newPassword": "..." }\`
6. Current User Profile: GET \`${window.location.origin}/api/v1/auth/me\`
   Headers: \`x-api-key: ${project?.apiKey}\`, \`Authorization: Bearer <accessToken>\`

Please create an authentication service module implementing these API calls with robust error handling, token refresh logic, and typed responses.`}
                  </pre>
                </div>
              </div>

              {/* Link to Full SDK Docs */}
              <div className="ai-prompt-docs-banner">
                <span>Looking for complete package reference, prop types, and examples?</span>
                <Link to="/dashboard/sdk-docs" className="ai-prompt-docs-link">
                  <span>View Full SDK Docs</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>

            <div className="ai-prompt-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPromptModal(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  let text = '';
                  if (activePromptTab === 'web') {
                    text = `You are a senior React engineer and AI agent coder. I want to build a complete authentication flow (Login, Sign Up, OTP Verification, Forgot Password, and Reset Password) in my existing React application using AuthEasy.

Configuration:
- API Base URL: ${window.location.origin}
- API Key: ${project?.apiKey}
- Project ID: ${project?.id}
- Recommended SDK: autheasy-react (npm)

Password Policy (Strict backend requirement):
The backend validates that all passwords must:
1. Be at least 8 characters long
2. Contain at least 1 uppercase letter (A-Z)
3. Contain at least 1 lowercase letter (a-z)
4. Contain at least 1 number (0-9)
5. Contain exactly one '@' symbol (no other special characters allowed!)
Example valid password: "MyPassword@123"

Tasks:
1. Wrap root with <AuthEasyProvider apiKey="${project?.apiKey}">.
2. Inspect the existing app design system (Tailwind CSS, CSS variables, components) to match its exact aesthetic.
3. Build responsive auth components:
   - Login Screen: email & password fields, forgot password link, loading spinner.
   - Sign Up Screen: name, email, password with live password checklist (8+ chars, uppercase, lowercase, number, single '@').
   - OTP Verification Screen: 6-digit verification code input with auto-advance and countdown resend timer.
   - Forgot / Reset Password Screens: email step followed by OTP + new password step.
4. Hook Integration: Use const { user, login, signup, verifyOtp, forgotPassword, resetPassword, logout, loading, error } = useAuthEasy(); to wire up all actions.`;
                  } else if (activePromptTab === 'flutter') {
                    text = `You are a senior Flutter mobile engineer and AI agent coder. I want to build a complete, production-grade mobile authentication flow in my Flutter application using AuthEasy.

Configuration:
- API Base URL: ${window.location.origin}
- API Key: ${project?.apiKey}
- Project ID: ${project?.id}
- Recommended Package: autheasy_flutter (or HTTP/Dio with flutter_secure_storage)

Password Policy (Strictly validated by AuthEasy backend):
Passwords must have at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and exactly one '@' symbol (no other symbols). Example: "FlutterApp@2026".

Tasks:
1. Initialize in main.dart: AuthEasy.initialize(apiKey: '${project?.apiKey}') or configure an AuthService singleton.
2. Match the app's existing ThemeData (colors, fonts, border radii, dark/light theme).
3. Build complete screens with smooth transitions and loading states:
   - LoginScreen: Email & password inputs, toggleable obscureText eye icon, forgot password button, error snackbars.
   - SignUpScreen: Full name, email, password input with dynamic requirement checklist (8+ chars, 1 uppercase, 1 lowercase, 1 number, single '@').
   - OtpVerificationScreen: 6-digit PIN input with auto-verification and 60-second resend countdown timer.
   - ForgotPasswordScreen & ResetPasswordScreen: Request OTP to email, then input OTP + new password.
4. Token Storage: Save JWT tokens securely using flutter_secure_storage. Provide an AuthState notifier managing isAuthenticated, currentUser, and auto-login on app launch.`;
                  } else if (activePromptTab === 'rn') {
                    text = `You are a senior React Native / Expo developer and AI agent coder. I want to build a complete native mobile authentication flow in my React Native application using AuthEasy.

Configuration:
- API Base URL: ${window.location.origin}
- API Key: ${project?.apiKey}
- Project ID: ${project?.id}
- Recommended Package: autheasy-react-native (or Axios with expo-secure-store / AsyncStorage)

Strict Password Policy:
Passwords must: be min 8 characters, include 1 uppercase, 1 lowercase, 1 digit, and exactly one '@' symbol. Example: "ReactNative@77".

Tasks:
1. Wrap root app with <AuthEasyProvider apiKey="${project?.apiKey}">.
2. Analyze styling setup (NativeWind / Tailwind, StyleSheet, React Native Paper, or custom theme) and adopt the exact same patterns.
3. Build native mobile screens:
   - LoginScreen: Email and password inputs, show/hide password toggle, forgot password link, loading spinner.
   - SignUpScreen: Name, email, password with live validation checklist.
   - OtpScreen: 6 individual digit input boxes with auto-focus next on type and backspace support.
   - ResetPasswordScreen: Enter OTP and new password with validation.
4. Wrap screens with KeyboardAvoidingView for clean keyboard dismiss. Persist tokens securely using expo-secure-store or @react-native-async-storage/async-storage.
5. Expose useAuth() hook with { user, login, signup, verifyOtp, forgotPassword, resetPassword, logout, loading }.`;
                  } else {
                    text = `You are an expert backend and API integration engineer. I want to integrate authentication into my application using the AuthEasy REST API.

Configuration:
- Base URL: ${window.location.origin}
- API Key: ${project?.apiKey}
- Project ID: ${project?.id}
- Required Header: x-api-key: ${project?.apiKey}
- Content-Type: application/json

Backend Password Rule:
Passwords must have at least 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 digit, and exactly one '@' symbol (no other special symbols allowed).

API Endpoints:
1. User Registration: POST ${window.location.origin}/api/v1/auth/register
   Body: { "name": "...", "email": "...", "password": "...", "contactNumber": "..." }
2. Verify OTP: POST ${window.location.origin}/api/v1/auth/verify-otp
   Body: { "email": "...", "otp": "..." }
3. User Login: POST ${window.location.origin}/api/v1/auth/login
   Body: { "email": "...", "password": "..." }
4. Forgot Password: POST ${window.location.origin}/api/v1/auth/forgot-password
   Body: { "email": "..." }
5. Reset Password: POST ${window.location.origin}/api/v1/auth/reset-password
   Body: { "email": "...", "otp": "...", "newPassword": "..." }
6. Current User Profile: GET ${window.location.origin}/api/v1/auth/me
   Headers: x-api-key: ${project?.apiKey}, Authorization: Bearer <accessToken>

Please create an authentication service module implementing these API calls with robust error handling, token refresh logic, and typed responses.`;
                  }
                  navigator.clipboard.writeText(text);
                  toast.success(`${activePromptTab.toUpperCase()} prompt copied to clipboard!`);
                }}
              >
                <Copy size={14} /> Copy {activePromptTab === 'api' ? 'REST API' : activePromptTab.toUpperCase()} Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
