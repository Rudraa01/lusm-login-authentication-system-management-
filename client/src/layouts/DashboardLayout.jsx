import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, FileText, Settings,
  LogOut, ChevronRight,
} from 'lucide-react';
import './DashboardLayout.css';

const navItems = [
  { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview', end: true },
  { path: '/dashboard/projects', icon: <FolderKanban size={20} />, label: 'Projects' },
  { path: '/dashboard/docs', icon: <FileText size={20} />, label: 'API Docs' },
  { path: '/dashboard/settings', icon: <Settings size={20} />, label: 'Settings' },
];

export default function DashboardLayout() {
  const { developer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">🔐</div>
            <span className="logo-text">LUSM</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight size={14} className="sidebar-link-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {developer?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{developer?.name || 'Developer'}</span>
              <span className="sidebar-user-email">{developer?.email || ''}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
