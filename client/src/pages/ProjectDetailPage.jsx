import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Key, Copy, Eye, EyeOff, RefreshCw, Users,
  Shield, Trash2, Ban, CheckCircle, Search, Loader2, Edit2, Mail, Sparkles, X
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
  const [expandedUser, setExpandedUser] = useState(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState('connect');

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/api/dash/projects/${id}`);
      setProject(res.data.data);
      setOrigins(res.data.data.allowedOrigins || '');
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

  const updateOrigins = async () => {
    try {
      await api.put(`/api/dash/projects/${id}/origins`, { allowedOrigins: origins });
      toast.success('Origins updated!');
    } catch (err) {
      toast.error('Failed to update origins');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/dashboard/projects" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
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
        <div className="glass-card" style={{ marginTop: 20, padding: 24 }}>
          <h3 style={{ color: 'var(--text-white)', marginBottom: 16, fontWeight: 700 }}>
            CORS — Allowed Origins
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Only requests from these origins will be accepted. Separate multiple origins with commas.
            Leave empty to allow all origins (not recommended for production).
          </p>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <textarea
              className="form-input"
              placeholder="http://localhost:3000, https://myapp.com"
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
              rows={3}
            />
          </div>
          <button className="btn btn-primary" onClick={updateOrigins}>
            Save Origins
          </button>
        </div>
      )}

      {/* AI Prompts Modal */}
      {showPromptModal && (
        <div className="ai-prompt-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="ai-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-prompt-modal-header">
              <div className="ai-prompt-modal-title">
                <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span>AI Developer Prompts</span>
              </div>
              <button className="ai-prompt-modal-close" onClick={() => setShowPromptModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="ai-prompt-modal-body">
              <div className="ai-prompt-tabs-container">
                <button
                  className={`ai-prompt-tab-btn ${activePromptTab === 'connect' ? 'active' : ''}`}
                  onClick={() => setActivePromptTab('connect')}
                >
                  Connect API in your App
                </button>
                <button
                  className={`ai-prompt-tab-btn ${activePromptTab === 'design' ? 'active' : ''}`}
                  onClick={() => setActivePromptTab('design')}
                >
                  Connect & Design Login
                </button>
              </div>

              {activePromptTab === 'connect' ? (
                <>
                  <p className="ai-prompt-desc">
                    Use this prompt to generate a production-ready authentication helper/service in your app to communicate with AuthEasy.
                  </p>
                  <div className="ai-prompt-code-wrapper">
                    <div className="ai-prompt-code-header">
                      <span>Integration Prompt</span>
                      <span>Markdown</span>
                    </div>
                    <pre className="ai-prompt-code-content">{`You are an expert developer. I want to integrate authentication into my application using the AuthEasy authentication service.

Here are the configuration details:
- **API Base URL**: http://localhost:4000
- **API Key**: ${project.apiKey}
- **Project ID**: ${project.id}

Please create an authentication service module (e.g., \`authService.js\` or \`auth.service.ts\`) using fetch or axios. It should implement the following API calls to the AuthEasy backend:

1. **User Registration**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/register\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "password": "...", "name": "...", "contactNumber": "..." }\`
   - **Note**: The backend enforces a strict password policy: Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly one '@' symbol (no other special characters are allowed). Include client-side validation for this rule.
   - **Response**: Returns \`{ success: true, message: "...", data: { userId: "...", email: "...", isVerified: false } }\`.

2. **Verify OTP (Signup Verification)**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/verify-otp\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "otp": "..." }\`
   - **Response**: Returns token credentials: \`{ success: true, data: { user: { id, email, name, contactNumber }, accessToken, refreshToken } }\`.

3. **User Login**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/login\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "password": "..." }\`
   - **Response**: Returns tokens: \`{ success: true, data: { user, accessToken, refreshToken } }\`.

4. **Forgot Password (Request Reset OTP)**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/forgot-password\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "..." }\` // Can be email OR phone

5. **Reset Password (Submit Reset OTP)**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/reset-password\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "otp": "...", "newPassword": "..." }\` // email can be email OR phone
   - **Note**: The backend password policy also applies here.

6. **Get Current User Profile**
   - **Endpoint**: \`GET http://localhost:4000/api/v1/auth/me\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Authorization": "Bearer <accessToken>" }\`

Please write complete, production-grade helper code, configure session management (saving the tokens securely in localStorage or cookies), and export these methods so I can easily use them in my application.`}</pre>
                  </div>
                </>
              ) : (
                <>
                  <p className="ai-prompt-desc">
                    Use this prompt to instruct your AI editor (Cursor, Windsurf, etc.) to analyze your existing codebase styling and create a matching login/signup/OTP flow.
                  </p>
                  <div className="ai-prompt-code-wrapper">
                    <div className="ai-prompt-code-header">
                      <span>UI & UX Prompt</span>
                      <span>Markdown</span>
                    </div>
                    <pre className="ai-prompt-code-content">{`You are a senior UI/UX engineer and AI agent coder. I want to build a complete authentication flow (Login, Sign Up, OTP Verification, Forgot Password, and Reset Password) in my existing application, integrated with the AuthEasy backend service.

Here are the integration details:
- **API Base URL**: http://localhost:4000
- **API Key**: \${project.apiKey}
- **Project ID**: \${project.id}

Your task is to:
1. **Analyze Existing Theme & Styling**: First, examine the existing codebase's styles, design system, colors, layout patterns, and libraries.
2. **Build and Design the Auth Pages**: Create stunning, modern, and highly interactive pages/components for:
   - **Sign Up / Registration** (Fields: Name, Email, Phone Number (optional), Password). Include strong password validation: the password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly one '@' symbol (no other symbols allowed). Show real-time strength validation.
   - **OTP Verification Screen** (Beautiful multi-digit input or clean code input field for email verification).
   - **Login Page** (Fields: Email or Phone Number, Password).
   - **Forgot Password Screen** (Enter email or phone number to send OTP).
   - **Reset Password Screen** (Enter OTP and new strong password).
3. **Integration**: Wire up these UI components with API requests to the AuthEasy backend endpoints at \`http://localhost:4000/api/v1/auth/...\` (register, verify-otp, login, forgot-password, reset-password). Make sure all requests include the \`x-api-key: \${project.apiKey}\` header.
4. **Visual & Styling Requirements**: Make the UI look extremely premium, mimicking high-end authentication designs (like Clerk, Vercel, or Stripe). Include subtle animations (fade-in, slide-up, loading spinner states) and ensure the layout is fully responsive and integrates perfectly with my application's theme and styles. Please build everything directly in the app's existing visual design language.`}</pre>
                  </div>
                </>
              )}
            </div>

            <div className="ai-prompt-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPromptModal(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const text = activePromptTab === 'connect' 
                    ? `You are an expert developer. I want to integrate authentication into my application using the AuthEasy authentication service.

Here are the configuration details:
- **API Base URL**: http://localhost:4000
- **API Key**: ${project.apiKey}
- **Project ID**: ${project.id}

Please create an authentication service module (e.g., \`authService.js\` or \`auth.service.ts\`) using fetch or axios. It should implement the following API calls to the AuthEasy backend:

1. **User Registration**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/register\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "password": "...", "name": "..." }\`
   - **Note**: The backend enforces a strict password policy: Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly one '@' symbol (no other special characters are allowed). Include client-side validation for this rule.
   - **Response**: Returns \`{ success: true, message: "...", data: { userId: "...", email: "...", isVerified: false } }\`.

2. **Verify OTP (Signup Verification)**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/verify-otp\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "otp": "..." }\`
   - **Response**: Returns token credentials: \`{ success: true, data: { user: { id, email, name }, accessToken, refreshToken } }\`.

3. **User Login**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/login\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "password": "..." }\`
   - **Response**: Returns tokens: \`{ success: true, data: { user, accessToken, refreshToken } }\`.

4. **Forgot Password (Request Reset OTP)**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/forgot-password\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "..." }\`

5. **Reset Password (Submit Reset OTP)**
   - **Endpoint**: \`POST http://localhost:4000/api/v1/auth/reset-password\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Content-Type": "application/json" }\`
   - **Body**: \`{ "email": "...", "otp": "...", "newPassword": "..." }\`
   - **Note**: The backend password policy also applies here.

6. **Get Current User Profile**
   - **Endpoint**: \`GET http://localhost:4000/api/v1/auth/me\`
   - **Headers**: \`{ "x-api-key": "${project.apiKey}", "Authorization": "Bearer <accessToken>" }\`

Please write complete, production-grade helper code, configure session management (saving the tokens securely in localStorage or cookies), and export these methods so I can easily use them in my application.`
                    : `You are a senior UI/UX engineer and AI agent coder. I want to build a complete authentication flow (Login, Sign Up, OTP Verification, Forgot Password, and Reset Password) in my existing application, integrated with the AuthEasy backend service.

Here are the integration details:
- **API Base URL**: http://localhost:4000
- **API Key**: ${project.apiKey}
- **Project ID**: ${project.id}

Your task is to:
1. **Analyze Existing Theme & Styling**: First, examine the existing codebase's styles, design system, colors, layout patterns, and libraries (e.g., check if we are using Tailwind CSS, vanilla CSS variables, CSS modules, glassmorphism, fonts, border radii, or libraries like Lucide React/Material-UI).
2. **Build and Design the Auth Pages**: Create stunning, modern, and highly interactive pages/components for:
   - **Sign Up / Registration** (Fields: Name, Email, Password). Include strong password validation: the password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly one '@' symbol (no other symbols allowed). Show real-time strength validation.
   - **OTP Verification Screen** (Beautiful multi-digit input or clean code input field for email verification).
   - **Login Page** (Fields: Email, Password).
   - **Forgot Password Screen** (Enter email to send OTP).
   - **Reset Password Screen** (Enter OTP and new strong password).
3. **Integration**: Wire up these UI components with API requests to the AuthEasy backend endpoints at \`http://localhost:4000/api/v1/auth/...\` (register, verify-otp, login, forgot-password, reset-password). Make sure all requests include the \`x-api-key: ${project.apiKey}\` header.
4. **Visual & Styling Requirements**: Make the UI look extremely premium, mimicking high-end authentication designs (like Clerk, Vercel, or Stripe). Include subtle animations (fade-in, slide-up, loading spinner states) and ensure the layout is fully responsive and integrates perfectly with my application's theme and styles. Please build everything directly in the app's existing visual design language.`;
                  
                  navigator.clipboard.writeText(text);
                  toast.success('Prompt copied to clipboard!');
                }}
              >
                <Copy size={14} /> Copy Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
