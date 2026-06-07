import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Code, LayoutTemplate } from 'lucide-react';
import './AdminPages.css';

export default function AdminUIsPage() {
  const [uis, setUis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUi, setEditingUi] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LOGIN',
    htmlCode: '',
    cssCode: '',
    jsCode: '',
    reactCode: '',
  });

  const fetchUis = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/uis');
      if (res.data.success) {
        setUis(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch UIs', err);
      setError('Failed to load UIs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUis();
  }, []);

  const handleOpenModal = (ui = null) => {
    if (ui) {
      setEditingUi(ui);
      setFormData({
        title: ui.title,
        description: ui.description,
        type: ui.type,
        htmlCode: ui.htmlCode,
        cssCode: ui.cssCode,
        jsCode: ui.jsCode,
        reactCode: ui.reactCode,
      });
    } else {
      setEditingUi(null);
      setFormData({
        title: '',
        description: '',
        type: 'LOGIN',
        htmlCode: '',
        cssCode: '',
        jsCode: '',
        reactCode: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUi(null);
  };

  const safeBtoa = (str) => {
    try {
      return btoa(unescape(encodeURIComponent(str || '')));
    } catch (e) {
      console.error('Base64 encoding failed:', e);
      return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        htmlCode: safeBtoa(formData.htmlCode),
        cssCode: safeBtoa(formData.cssCode),
        jsCode: safeBtoa(formData.jsCode),
        reactCode: safeBtoa(formData.reactCode),
      };
      if (editingUi) {
        await api.put(`/api/admin/uis/${editingUi.id}`, payload);
      } else {
        await api.post('/api/admin/uis', payload);
      }
      handleCloseModal();
      fetchUis();
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save UI.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this UI?')) return;
    try {
      await api.delete(`/api/admin/uis/${id}`);
      fetchUis();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete UI.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="page-title admin-page-title">Pre-built UIs</h1>
          <p className="page-subtitle admin-page-subtitle">Manage UI templates available for developers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add New UI
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <div className="card admin-table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uis.map((ui) => (
                  <tr key={ui.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LayoutTemplate size={16} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ui.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{ui.type}</span>
                    </td>
                    <td>{ui.description || '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-icon btn-secondary-soft"
                          onClick={() => handleOpenModal(ui)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-danger-soft"
                          onClick={() => handleDelete(ui.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {uis.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Code size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
                      <div style={{ color: 'var(--text-secondary)' }}>No pre-built UIs added yet.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <h2 className="modal-title">{editingUi ? 'Edit Pre-built UI' : 'Add Pre-built UI'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="LOGIN">Login Page</option>
                    <option value="SIGNUP">Signup Page</option>
                    <option value="PROFILE">User Profile</option>
                    <option value="FORGOT_PASSWORD">Forgot Password</option>
                    <option value="COMPONENT">Generic Component</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">HTML Code</label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  value={formData.htmlCode}
                  onChange={(e) => setFormData({ ...formData, htmlCode: e.target.value })}
                  placeholder="<div>Hello World</div>"
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">CSS Code</label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  value={formData.cssCode}
                  onChange={(e) => setFormData({ ...formData, cssCode: e.target.value })}
                  placeholder="div { color: red; }"
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">JavaScript Code (Optional)</label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  value={formData.jsCode}
                  onChange={(e) => setFormData({ ...formData, jsCode: e.target.value })}
                  placeholder="console.log('init');"
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">React Code (Optional)</label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  value={formData.reactCode}
                  onChange={(e) => setFormData({ ...formData, reactCode: e.target.value })}
                  placeholder="export default function Login() { ... }"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUi ? 'Update UI' : 'Create UI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
