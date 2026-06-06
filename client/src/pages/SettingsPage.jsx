import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Lock, Loader2, Save } from 'lucide-react';
import './DashboardPages.css';

export default function SettingsPage() {
  const { developer } = useAuth();
  const [name, setName] = useState(developer?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {};
      if (name !== developer?.name) data.name = name;
      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }

      if (Object.keys(data).length === 0) {
        toast('No changes to save');
        setSaving(false);
        return;
      }

      await api.put('/api/dash/me', data);
      toast.success('Settings saved!');

      // Update local storage
      const saved = JSON.parse(localStorage.getItem('autheasy_developer') || '{}');
      if (data.name) saved.name = data.name;
      localStorage.setItem('autheasy_developer', JSON.stringify(saved));

      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your developer account</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: 560 }}>
        {/* Profile Section */}
        <div className="glass-card settings-section">
          <h3 className="settings-section-title">
            <User size={18} /> Profile
          </h3>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={developer?.email || ''}
              disabled
              style={{ opacity: 0.6 }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Email cannot be changed
            </span>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="glass-card settings-section" style={{ marginTop: 20 }}>
          <h3 className="settings-section-title">
            <Lock size={18} /> Change Password
          </h3>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter new password (min. 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ marginTop: 20 }}
          disabled={saving}
        >
          {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
