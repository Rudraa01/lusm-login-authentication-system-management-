import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Search, ShieldAlert, ShieldCheck, Trash2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminPages.css';

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchDevelopers();
  }, [page, search]);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/developers', {
        params: { search, page, limit: 10 },
      });
      setDevelopers(res.data.data.developers);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch developers:', err);
      toast.error('Failed to load developers list.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (id, currentStatus) => {
    setActionLoadingId(id);
    const newStatus = !currentStatus;
    try {
      await api.put(`/api/admin/developers/${id}/block`, { isBlocked: newStatus });
      setDevelopers(prev =>
        prev.map(dev => (dev.id === id ? { ...dev, isBlocked: newStatus } : dev))
      );
      toast.success(`Developer successfully ${newStatus ? 'blocked' : 'unblocked'}!`);
    } catch (err) {
      console.error('Block toggle error:', err);
      toast.error('Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteDeveloper = async (id, name) => {
    if (!window.confirm(`WARNING: Are you sure you want to delete developer "${name}"?\nThis will delete ALL their projects, API keys, and end-user data. This action CANNOT be undone.`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      await api.delete(`/api/admin/developers/${id}`);
      setDevelopers(prev => prev.filter(dev => dev.id !== id));
      toast.success('Developer deleted successfully.');
    } catch (err) {
      console.error('Delete developer error:', err);
      toast.error('Failed to delete developer.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="animate-fade-in developers-admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title admin-page-title">Manage Developers</h1>
          <p className="page-subtitle">View profiles, block/unblock access, or delete developers</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="admin-actions-bar">
        <div className="search-box admin-search-box">
          <Search size={18} className="search-icon" />
          <input
            id="admin-search-developers"
            type="text"
            className="form-input search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card table-card">
        {loading && developers.length === 0 ? (
          <div className="table-loading">
            <Loader2 className="spin" size={32} />
            <p>Loading developers list...</p>
          </div>
        ) : developers.length === 0 ? (
          <div className="table-empty">
            <h3>No developers found</h3>
            <p>No developers registered matching the search term.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Developer</th>
                  <th>Projects</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((dev) => (
                  <tr key={dev.id} className={dev.isBlocked ? 'row-blocked' : ''}>
                    <td>
                      <div className="td-developer">
                        <span className="dev-avatar">
                          {dev.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="dev-text">
                          <Link to={`/admin/developers/${dev.id}`} className="dev-table-name">
                            {dev.name}
                          </Link>
                          <span className="dev-table-email">{dev.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="dev-table-projects-badge">
                        {dev.projectCount} {dev.projectCount === 1 ? 'project' : 'projects'}
                      </span>
                    </td>
                    <td>
                      <span className="dev-table-date">
                        {new Date(dev.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${dev.isBlocked ? 'status-blocked' : 'status-active'}`}>
                        {dev.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="actions-btn-group">
                        <button
                          className={`btn btn-sm btn-icon ${dev.isBlocked ? 'btn-success-soft' : 'btn-warning-soft'}`}
                          title={dev.isBlocked ? 'Unblock Developer' : 'Block Developer'}
                          onClick={() => handleBlockToggle(dev.id, dev.isBlocked)}
                          disabled={actionLoadingId === dev.id}
                        >
                          {dev.isBlocked ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        </button>
                        <button
                          className="btn btn-sm btn-danger-soft btn-icon"
                          title="Delete Developer"
                          onClick={() => handleDeleteDeveloper(dev.id, dev.name)}
                          disabled={actionLoadingId === dev.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1 || loading}
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          >
            <ArrowLeft size={14} /> Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === totalPages || loading}
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
