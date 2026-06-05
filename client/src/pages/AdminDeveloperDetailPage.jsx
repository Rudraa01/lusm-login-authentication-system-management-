import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, ShieldAlert, ShieldCheck, Trash2, Calendar, Mail, User, FolderKanban, Users, Key, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminPages.css';

export default function AdminDeveloperDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDeveloperDetails();
  }, [id]);

  const fetchDeveloperDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/developers/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch developer details:', err);
      toast.error('Failed to load developer details.');
      navigate('/admin/developers');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!data) return;
    setActionLoading(true);
    const newStatus = !data.developer.isBlocked;
    try {
      await api.put(`/api/admin/developers/${id}/block`, { isBlocked: newStatus });
      setData(prev => ({
        ...prev,
        developer: { ...prev.developer, isBlocked: newStatus },
      }));
      toast.success(`Developer successfully ${newStatus ? 'blocked' : 'unblocked'}!`);
    } catch (err) {
      console.error('Block toggle error:', err);
      toast.error('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDeveloper = async () => {
    if (!data) return;
    const { name } = data.developer;
    if (!window.confirm(`WARNING: Are you sure you want to delete developer "${name}"?\nThis will delete ALL their projects, API keys, and end-user data. This action CANNOT be undone.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/api/admin/developers/${id}`);
      toast.success('Developer deleted successfully.');
      navigate('/admin/developers');
    } catch (err) {
      console.error('Delete developer error:', err);
      toast.error('Failed to delete developer.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Link to="/admin/developers" className="btn-back">
          <ArrowLeft size={16} /> Back to developers
        </Link>
        <div className="skeleton" style={{ width: 300, height: 40, marginTop: 16 }} />
        <div className="developer-detail-grid" style={{ marginTop: 24 }}>
          <div className="glass-card skeleton" style={{ height: 250 }} />
          <div className="glass-card skeleton" style={{ height: 250 }} />
        </div>
      </div>
    );
  }

  const { developer, projects } = data;

  return (
    <div className="animate-fade-in developer-detail-page">
      <Link to="/admin/developers" className="btn-back">
        <ArrowLeft size={16} /> Back to developers
      </Link>

      <div className="page-header detail-header">
        <div className="header-info">
          <div className="dev-large-avatar">
            {developer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="page-title">{developer.name}</h1>
            <p className="page-subtitle">Developer account overview & projects</p>
          </div>
        </div>
        <div className="actions-btn-group">
          <button
            className={`btn ${developer.isBlocked ? 'btn-success' : 'btn-warning'}`}
            onClick={handleBlockToggle}
            disabled={actionLoading}
          >
            {developer.isBlocked ? (
              <>
                <ShieldCheck size={16} /> Unblock Developer
              </>
            ) : (
              <>
                <ShieldAlert size={16} /> Block Developer
              </>
            )}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDeleteDeveloper}
            disabled={actionLoading}
          >
            <Trash2 size={16} /> Delete Developer
          </button>
        </div>
      </div>

      <div className="developer-detail-grid">
        {/* Profile Details Card */}
        <div className="glass-card detail-profile-card">
          <h3>Developer Profile</h3>
          <div className="profile-details-list">
            <div className="profile-detail-item">
              <User size={18} className="detail-icon" />
              <div>
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{developer.name}</span>
              </div>
            </div>
            <div className="profile-detail-item">
              <Mail size={18} className="detail-icon" />
              <div>
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{developer.email}</span>
              </div>
            </div>
            <div className="profile-detail-item">
              <Calendar size={18} className="detail-icon" />
              <div>
                <span className="detail-label">Registration Date</span>
                <span className="detail-value">
                  {new Date(developer.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="profile-detail-item">
              <ShieldAlert size={18} className="detail-icon" />
              <div>
                <span className="detail-label">Account Status</span>
                <span className={`status-badge ${developer.isBlocked ? 'status-blocked' : 'status-active'}`}>
                  {developer.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Summary Stats Card */}
        <div className="glass-card detail-stats-card">
          <h3>Activity Summary</h3>
          <div className="stats-mini-grid">
            <div className="stat-mini-card">
              <FolderKanban size={20} className="icon-project" />
              <div className="stat-mini-text">
                <span className="stat-mini-val">{projects.length}</span>
                <span className="stat-mini-lbl">Projects Created</span>
              </div>
            </div>
            <div className="stat-mini-card">
              <Users size={20} className="icon-users" />
              <div className="stat-mini-text">
                <span className="stat-mini-val">
                  {projects.reduce((sum, p) => sum + p.userCount, 0)}
                </span>
                <span className="stat-mini-lbl">Total End-Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="developer-projects-section">
        <h2 className="section-title">Developer's Projects</h2>
        {projects.length === 0 ? (
          <div className="glass-card empty-projects-card">
            <FolderKanban size={40} />
            <p>This developer hasn't created any projects yet.</p>
          </div>
        ) : (
          <div className="detail-projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="glass-card detail-project-card">
                <div className="project-card-header">
                  <h4>{project.name}</h4>
                  <span className="project-user-badge">
                    <Users size={14} /> {project.userCount} users
                  </span>
                </div>
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                <div className="project-card-meta">
                  <div className="meta-row">
                    <Key size={14} className="meta-icon" />
                    <span className="meta-label">API Key:</span>
                    <span className="meta-value code-font">{project.apiKey}</span>
                  </div>
                  <div className="meta-row">
                    <Globe size={14} className="meta-icon" />
                    <span className="meta-label">Allowed Origins:</span>
                    <span className="meta-value">
                      {project.allowedOrigins || 'Any (*) origin allowed'}
                    </span>
                  </div>
                  <div className="meta-row">
                    <Calendar size={14} className="meta-icon" />
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
