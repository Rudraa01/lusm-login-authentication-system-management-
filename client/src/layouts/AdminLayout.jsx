import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import {
  LayoutDashboard, Users, LogOut, ChevronRight, ShieldAlert
} from 'lucide-react';
import './AdminLayout.css';

const navItems = [
  { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Overview', end: true },
  { path: '/admin/developers', icon: <Users size={20} />, label: 'Developers' },
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
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <div className="admin-logo-icon">🛡️</div>
            <span className="admin-logo-text">LUSM Admin</span>
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
    </div>
  );
}
