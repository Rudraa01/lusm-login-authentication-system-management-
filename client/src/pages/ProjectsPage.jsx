import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, Key, Trash2, Loader2 } from 'lucide-react';
import './DashboardPages.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', allowedOrigins: '', logoUrl: '' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/dash/projects');
      setProjects(res.data.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/api/dash/projects', newProject);
      toast.success('Project created! 🎉');
      setShowModal(false);
      setNewProject({ name: '', description: '', allowedOrigins: '', logoUrl: '' });
      navigate(`/dashboard/projects/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete all users in this project.`)) return;
    try {
      await api.delete(`/api/dash/projects/${id}`);
      toast.success('Project deleted');
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your projects and API keys</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="projects-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card" style={{ padding: 24 }}>
              <div className="skeleton" style={{ width: '60%', height: 20, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 20 }} />
              <div className="skeleton" style={{ width: '100%', height: 14 }} />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Create your first project to get an API key and start authenticating users.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="glass-card project-card">
              <div className="project-card-header">
                <Link to={`/dashboard/projects/${project.id}`} className="project-card-link">
                  <div className="project-card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', overflow: 'hidden', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                    {project.logoUrl ? (
                      <img src={project.logoUrl} alt={project.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                    ) : null}
                    <FolderKanban size={20} style={{ display: project.logoUrl ? 'none' : 'block' }} />
                  </div>
                  <div style={{ marginLeft: '8px' }}>
                    <h3 className="project-card-name">{project.name}</h3>
                    {project.description && (
                      <p className="project-card-desc">{project.description}</p>
                    )}
                  </div>
                </Link>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => handleDelete(project.id, project.name)}
                  title="Delete project"
                >
                  <Trash2 size={16} style={{ color: 'var(--accent-rose)' }} />
                </button>
              </div>

              <div className="project-card-stats">
                <div className="project-stat">
                  <Users size={14} />
                  <span>{project.userCount} users</span>
                </div>
                <div className="project-stat">
                  <Key size={14} />
                  <span className="api-key-masked">{project.apiKey.substring(0, 20)}...</span>
                </div>
              </div>

              <div className="project-card-footer">
                <span className="project-date">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <Link to={`/dashboard/projects/${project.id}`} className="btn btn-secondary btn-sm">
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="My Awesome App"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief description (optional)"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Allowed Origins (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://local.dev:3000, https://myapp.com"
                    value={newProject.allowedOrigins}
                    onChange={(e) => setNewProject({ ...newProject, allowedOrigins: e.target.value })}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Leave empty to allow all origins (not recommended for production)
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Project Logo URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://myapp.com/logo.png"
                    value={newProject.logoUrl}
                    onChange={(e) => setNewProject({ ...newProject, logoUrl: e.target.value })}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Direct URL to your project logo (used in transaction emails)
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
