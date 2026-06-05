import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FolderKanban, Users, Key, Plus, ArrowRight } from 'lucide-react';
import './DashboardPages.css';

export default function DashboardHome() {
  const [stats, setStats] = useState({ projects: 0, totalUsers: 0 });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/dash/projects');
      const projectData = res.data.data;
      setProjects(projectData);
      setStats({
        projects: projectData.length,
        totalUsers: projectData.reduce((sum, p) => sum + (p.userCount || 0), 0),
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 300, height: 16 }} />
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card stat-card">
              <div className="skeleton" style={{ width: 80, height: 14 }} />
              <div className="skeleton" style={{ width: 60, height: 36, marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your projects and users</p>
        </div>
        <Link to="/dashboard/projects" className="btn btn-primary">
          <Plus size={16} />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <FolderKanban size={22} />
          </div>
          <span className="stat-label">Total Projects</span>
          <span className="stat-value">{stats.projects}</span>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <Users size={22} />
          </div>
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Key size={22} />
          </div>
          <span className="stat-label">API Keys</span>
          <span className="stat-value">{stats.projects}</span>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="dashboard-section">
        <div className="section-row">
          <h2 className="section-heading">Recent Projects</h2>
          <Link to="/dashboard/projects" className="btn btn-ghost btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="glass-card empty-state">
            <FolderKanban size={48} />
            <h3>No projects yet</h3>
            <p>Create your first project to get an API key and start authenticating users.</p>
            <Link to="/dashboard/projects" className="btn btn-primary" style={{ marginTop: 16 }}>
              <Plus size={16} /> Create Project
            </Link>
          </div>
        ) : (
          <div className="projects-preview-grid">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/dashboard/projects/${project.id}`}
                className="glass-card project-preview-card"
              >
                <div className="project-preview-header">
                  <div className="project-preview-icon">
                    <FolderKanban size={18} />
                  </div>
                  <h3>{project.name}</h3>
                </div>
                <div className="project-preview-stats">
                  <span><Users size={14} /> {project.userCount} users</span>
                  <span className="project-preview-key">
                    <Key size={14} /> {project.apiKey.substring(0, 16)}...
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
