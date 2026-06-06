import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Users, FolderKanban, ShieldAlert, ArrowRight, UserPlus, Star } from 'lucide-react';
import './AdminPages.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 250, height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 350, height: 16 }} />
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card stat-card admin-stat-card">
              <div className="skeleton" style={{ width: 100, height: 14 }} />
              <div className="skeleton" style={{ width: 60, height: 36, marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in admin-dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title admin-page-title">Admin Console</h1>
          <p className="page-subtitle">Overall health, statistics, and developers of AuthEasy</p>
        </div>
        <div className="admin-badge">
          <ShieldAlert size={16} />
          Super Admin Panel
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card admin-stat-card">
          <div className="stat-icon admin-stat-icon-dev">
            <Users size={22} />
          </div>
          <span className="stat-label">Total Developers</span>
          <span className="stat-value">{stats?.totalDevelopers}</span>
        </div>

        <div className="glass-card stat-card admin-stat-card">
          <div className="stat-icon admin-stat-icon-proj">
            <FolderKanban size={22} />
          </div>
          <span className="stat-label">Total Projects</span>
          <span className="stat-value">{stats?.totalProjects}</span>
        </div>

        <div className="glass-card stat-card admin-stat-card">
          <div className="stat-icon admin-stat-icon-user">
            <Users size={22} />
          </div>
          <span className="stat-label">Total End-Users</span>
          <span className="stat-value">{stats?.totalEndUsers}</span>
        </div>
      </div>

      {/* Lists Section */}
      <div className="admin-dashboard-grid">
        {/* Recent Developers */}
        <div className="glass-card admin-section-card">
          <div className="section-header-row">
            <h2 className="admin-section-heading">
              <UserPlus size={18} /> Recent Developers
            </h2>
            <Link to="/admin/developers" className="btn btn-ghost btn-sm admin-btn-ghost">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="admin-list">
            {stats?.recentDevelopers?.length === 0 ? (
              <p className="admin-empty-text">No developers registered yet.</p>
            ) : (
              stats?.recentDevelopers?.map((dev) => (
                <div key={dev.id} className="admin-list-item">
                  <div className="dev-info-left">
                    <span className="dev-avatar">
                      {dev.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="dev-text">
                      <Link to={`/admin/developers/${dev.id}`} className="dev-name-link">
                        {dev.name}
                      </Link>
                      <span className="dev-email">{dev.email}</span>
                    </div>
                  </div>
                  <div className="dev-info-right">
                    <span className={`status-badge ${dev.isBlocked ? 'status-blocked' : 'status-active'}`}>
                      {dev.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    <span className="dev-date">
                      {new Date(dev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Projects */}
        <div className="glass-card admin-section-card">
          <div className="section-header-row">
            <h2 className="admin-section-heading">
              <Star size={18} /> Top Projects
            </h2>
          </div>

          <div className="admin-list">
            {stats?.projectsWithUserCount?.length === 0 ? (
              <p className="admin-empty-text">No projects created yet.</p>
            ) : (
              stats?.projectsWithUserCount?.map((project, idx) => (
                <div key={project.id} className="admin-list-item">
                  <div className="dev-info-left">
                    <span className="project-index">#{idx + 1}</span>
                    <div className="dev-text">
                      <span className="project-name-text">{project.name}</span>
                      <span className="project-id-text">ID: {project.id}</span>
                    </div>
                  </div>
                  <div className="dev-info-right text-right">
                    <span className="project-user-count">
                      <strong>{project.userCount}</strong> end-users
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
