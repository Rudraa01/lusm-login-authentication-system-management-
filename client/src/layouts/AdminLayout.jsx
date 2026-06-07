import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import {
  LayoutDashboard, Users, BarChart3, LogOut, ChevronRight, ShieldAlert, LayoutTemplate
} from 'lucide-react';
import './AdminLayout.css';

const navItems = [
  { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Overview', end: true },
  { path: '/admin/developers', icon: <Users size={20} />, label: 'Developers' },
  { path: '/admin/uis', icon: <LayoutTemplate size={20} />, label: 'Pre-built UIs' },
  { path: '/admin/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
];

export default function AdminLayout() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <div className="admin-mobile-header-logo">
          <img src="/logo.png" alt="AuthEasy Logo" className="logo-img" />
        </div>
        <button className="admin-mobile-logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
        </button>
      </header>

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <div className="admin-logo-icon">
              <img src="/logo.png" alt="AuthEasy" className="logo-img" />
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `admin-sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight size={14} className="admin-sidebar-link-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-avatar">
              <ShieldAlert size={18} />
            </div>
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-user-name">Super Admin</span>
              <span className="admin-sidebar-user-email">{admin?.email || ''}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm admin-sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-dashboard-main">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="admin-mobile-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `admin-mobile-nav-link ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
