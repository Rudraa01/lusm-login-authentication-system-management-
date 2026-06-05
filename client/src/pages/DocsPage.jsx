import { useState } from 'react';
import { Copy, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './DashboardPages.css';

const endpoints = [
  {
    category: 'User Registration & Login',
    items: [
      {
        method: 'POST',
        path: '/api/v1/auth/register',
        title: 'Register a new user',
        description: 'Creates a new user account and sends an OTP to their email for verification.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY' },
        body: { email: 'user@example.com', password: 'securePassword123', name: 'John Doe' },
        response: { success: true, message: 'Registration successful. Please verify your email.', data: { userId: 'uuid', email: 'user@example.com', isVerified: false } },
      },
      {
        method: 'POST',
        path: '/api/v1/auth/verify-otp',
        title: 'Verify email OTP',
        description: 'Verifies the OTP sent to the user\'s email and activates the account. Returns JWT tokens.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY' },
        body: { email: 'user@example.com', otp: '123456' },
        response: { success: true, data: { user: { id: 'uuid', email: 'user@example.com', isVerified: true }, accessToken: 'jwt...', refreshToken: 'uuid...' } },
      },
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        title: 'Login user',
        description: 'Authenticates a verified user and returns JWT access and refresh tokens.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY' },
        body: { email: 'user@example.com', password: 'securePassword123' },
        response: { success: true, data: { user: { id: 'uuid', email: 'user@example.com', name: 'John' }, accessToken: 'jwt...', refreshToken: 'uuid...' } },
      },
    ],
  },
  {
    category: 'Password Reset',
    items: [
      {
        method: 'POST',
        path: '/api/v1/auth/forgot-password',
        title: 'Request password reset',
        description: 'Sends a password reset OTP to the user\'s email.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY' },
        body: { email: 'user@example.com' },
        response: { success: true, message: 'If an account exists, an OTP has been sent.' },
      },
      {
        method: 'POST',
        path: '/api/v1/auth/reset-password',
        title: 'Reset password',
        description: 'Resets the password using the OTP received via email.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY' },
        body: { email: 'user@example.com', otp: '123456', newPassword: 'newSecurePass' },
        response: { success: true, message: 'Password reset successfully.' },
      },
    ],
  },
  {
    category: 'User Profile',
    items: [
      {
        method: 'GET',
        path: '/api/v1/auth/me',
        title: 'Get user profile',
        description: 'Returns the authenticated user\'s profile data.',
        headers: { 'x-api-key': 'YOUR_API_KEY', 'Authorization': 'Bearer ACCESS_TOKEN' },
        body: null,
        response: { success: true, data: { id: 'uuid', email: 'user@example.com', name: 'John', avatarUrl: '' } },
      },
      {
        method: 'PUT',
        path: '/api/v1/auth/me',
        title: 'Update user profile',
        description: 'Updates the name or avatar URL of the authenticated user.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY', 'Authorization': 'Bearer ACCESS_TOKEN' },
        body: { name: 'Jane Doe', avatarUrl: 'https://example.com/avatar.jpg' },
        response: { success: true, message: 'Profile updated.', data: { id: 'uuid', name: 'Jane Doe' } },
      },
    ],
  },
  {
    category: 'Token Management',
    items: [
      {
        method: 'POST',
        path: '/api/v1/auth/refresh-token',
        title: 'Refresh access token',
        description: 'Gets a new access token using a valid refresh token.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY' },
        body: { refreshToken: 'your-refresh-token-uuid' },
        response: { success: true, data: { accessToken: 'new-jwt...' } },
      },
      {
        method: 'POST',
        path: '/api/v1/auth/resend-otp',
        title: 'Resend verification OTP',
        description: 'Resends the signup verification OTP to the user\'s email.',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_API_KEY' },
        body: { email: 'user@example.com' },
        response: { success: true, message: 'OTP has been resent.' },
      },
    ],
  },
];

const methodColors = {
  GET: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  POST: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
  PUT: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
  PATCH: { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
  DELETE: { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' },
};

function EndpointCard({ endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const mc = methodColors[endpoint.method];

  const curlExample = `curl -X ${endpoint.method} http://localhost:4000${endpoint.path} \\
${Object.entries(endpoint.headers).map(([k, v]) => `  -H "${k}: ${v}"`).join(' \\\n')}${endpoint.body ? ` \\
  -d '${JSON.stringify(endpoint.body)}'` : ''}`;

  return (
    <div className="endpoint-card">
      <div className="endpoint-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            className="method-badge"
            style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.border}` }}
          >
            {endpoint.method}
          </span>
          <code className="endpoint-path">{endpoint.path}</code>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="endpoint-title">{endpoint.title}</span>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="endpoint-body animate-slide-up">
          <p className="endpoint-desc">{endpoint.description}</p>

          <h4>Headers</h4>
          <div className="code-block">
            <pre>{JSON.stringify(endpoint.headers, null, 2)}</pre>
          </div>

          {endpoint.body && (
            <>
              <h4>Request Body</h4>
              <div className="code-block">
                <pre>{JSON.stringify(endpoint.body, null, 2)}</pre>
              </div>
            </>
          )}

          <h4>Response</h4>
          <div className="code-block">
            <pre>{JSON.stringify(endpoint.response, null, 2)}</pre>
          </div>

          <h4>cURL Example</h4>
          <div className="code-block">
            <div className="code-block-header">
              <span>Terminal</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { navigator.clipboard.writeText(curlExample); toast.success('Copied!'); }}
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre>{curlExample}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">API Documentation</h1>
          <p className="page-subtitle">
            Complete reference for the LUSM Public Authentication API
          </p>
        </div>
      </div>

      <div className="docs-intro glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ color: 'var(--text-white)', marginBottom: 8 }}>Base URL</h3>
        <code style={{ color: 'var(--accent-cyan)', fontSize: 15 }}>http://localhost:4000</code>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 12 }}>
          All public API endpoints require the <code style={{ color: 'var(--accent-primary)' }}>x-api-key</code> header
          with your project's API key. Get your key from the{' '}
          <a href="/dashboard/projects">Projects page</a>.
        </p>
      </div>

      {endpoints.map((group) => (
        <div key={group.category} className="docs-group">
          <h2 className="docs-group-title">{group.category}</h2>
          <div className="docs-endpoints">
            {group.items.map((ep) => (
              <EndpointCard key={ep.path + ep.method} endpoint={ep} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
