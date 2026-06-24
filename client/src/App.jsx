import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardHome from './pages/DashboardHome';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import DocsPage from './pages/DocsPage';
import SettingsPage from './pages/SettingsPage';
import PrebuiltUIsPage from './pages/PrebuiltUIsPage';
import PreviewPage from './pages/PreviewPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminDevelopersPage from './pages/AdminDevelopersPage';
import AdminDeveloperDetailPage from './pages/AdminDeveloperDetailPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminUIsPage from './pages/AdminUIsPage';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { developer, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0f172a', color: '#94a3b8' }}>
        <div className="skeleton" style={{ width: 100, height: 40 }} />
      </div>
    );
  }

  if (!developer) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect if logged in
function AuthRoute({ children }) {
  const { developer, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0f172a', color: '#94a3b8' }}>
        <div className="skeleton" style={{ width: 100, height: 40 }} />
      </div>
    );
  }

  if (developer) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Protected Admin Route Component
function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0f172a', color: '#94a3b8' }}>
        <div className="skeleton" style={{ width: 100, height: 40 }} />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// Redirect if Admin logged in
function AdminAuthRoute({ children }) {
  const { admin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0f172a', color: '#94a3b8' }}>
        <div className="skeleton" style={{ width: 100, height: 40 }} />
      </div>
    );
  }

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRoute>
                  <SignupPage />
                </AuthRoute>
              }
            />
            <Route
              path="/preview/:id"
              element={<PreviewPage />}
            />
            <Route
              path="/templates"
              element={<PrebuiltUIsPage isPublic={true} />}
            />

            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="uis" element={<PrebuiltUIsPage />} />
              <Route path="docs" element={<DocsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin Login Route */}
            <Route
              path="/admin/login"
              element={
                <AdminAuthRoute>
                  <AdminLoginPage />
                </AdminAuthRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="developers" element={<AdminDevelopersPage />} />
              <Route path="developers/:id" element={<AdminDeveloperDetailPage />} />
              <Route path="uis" element={<AdminUIsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            },
          }}
        />
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
