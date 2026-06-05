import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Key, Copy, Eye, EyeOff, RefreshCw, Users,
  Shield, Trash2, Ban, CheckCircle, Search, Loader2,
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
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {user.email}
                      </td>
                      <td>{user.name || '—'}</td>
                      <td>
                        {user.isBlocked ? (
                          <span className="badge badge-danger">Blocked</span>
                        ) : user.isVerified ? (
                          <span className="badge badge-success">Verified</span>
                        ) : (
                          <span className="badge badge-warning">Unverified</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleBlock(user.id, user.isBlocked)}
                            title={user.isBlocked ? 'Unblock' : 'Block'}
                          >
                            {user.isBlocked ? <CheckCircle size={14} /> : <Ban size={14} />}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => deleteUser(user.id)}
                            title="Delete"
                            style={{ color: 'var(--accent-rose)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
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
    </div>
  );
}
