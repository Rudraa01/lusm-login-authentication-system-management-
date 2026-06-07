const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Run database migrations programmatically on production startup
if (process.env.NODE_ENV === 'production') {
  try {
    const { execSync } = require('child_process');
    console.log('🔄 Running database migrations (Prisma)...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '../') // Run from server directory
    });
    console.log('✅ Database migrations applied successfully.');
  } catch (err) {
    console.error('❌ Database migrations failed:', err);
  }
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const developerAuthRoutes = require('./routes/developer.auth.routes');
const projectRoutes = require('./routes/project.routes');
const userManagementRoutes = require('./routes/user.management.routes');
const publicAuthRoutes = require('./routes/public.auth.routes');
const adminRoutes = require('./routes/admin.routes');
const uiRoutes = require('./routes/ui.routes');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Global Middleware ──────────────────────────────────────────
app.use(helmet());

// Dynamic CORS configuration
const corsOptions = (req, callback) => {
  let options;
  const isPublicApi = req.path.startsWith('/api/v1/auth');
  
  if (isPublicApi) {
    // Allow the requesting origin (validation is performed in validateApiKey middleware)
    options = { origin: true, credentials: true };
  } else {
    // Restrict admin and dashboard to the frontend URL
    options = {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    };
  }
  callback(null, options);
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AuthEasy API is running 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Dashboard Routes (for developers on our platform) ─────────
app.use('/api/dash', developerAuthRoutes);
app.use('/api/dash/projects', projectRoutes);
app.use('/api/dash/projects', userManagementRoutes);

// ─── Super Admin Routes (for AuthEasy owners) ───────────────────────
app.use('/api/admin', adminRoutes);

// ─── Public Auth API (for end-users via developer's frontend) ──
app.use('/api/v1/auth', requestLogger, publicAuthRoutes);

// ─── Pre-built UI API ──────────────────────────────────────────
app.use('/api/v1/ui', requestLogger, uiRoutes);

// ─── API Documentation Endpoint ────────────────────────────────
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'AuthEasy API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}`,
    endpoints: {
      dashboard: {
        auth: {
          'POST /api/dash/signup': 'Register a new developer account',
          'POST /api/dash/login': 'Login to developer dashboard',
          'GET /api/dash/me': 'Get developer profile (Bearer token required)',
          'PUT /api/dash/me': 'Update developer profile',
        },
        projects: {
          'POST /api/dash/projects': 'Create a new project',
          'GET /api/dash/projects': 'List all your projects',
          'GET /api/dash/projects/:id': 'Get project details',
          'PUT /api/dash/projects/:id': 'Update project',
          'DELETE /api/dash/projects/:id': 'Delete project',
          'POST /api/dash/projects/:id/regenerate-key': 'Regenerate API key',
          'PUT /api/dash/projects/:id/origins': 'Update allowed origins',
        },
        userManagement: {
          'GET /api/dash/projects/:id/users': 'List all users (paginated)',
          'PATCH /api/dash/projects/:id/users/:userId/block': 'Block/unblock user',
          'DELETE /api/dash/projects/:id/users/:userId': 'Delete user',
        },
      },
      publicApi: {
        note: 'All public API endpoints require x-api-key header',
        'POST /api/v1/auth/register': 'Register end-user (sends OTP)',
        'POST /api/v1/auth/verify-otp': 'Verify OTP (activates account)',
        'POST /api/v1/auth/login': 'Login end-user (returns JWT)',
        'POST /api/v1/auth/forgot-password': 'Send password reset OTP',
        'POST /api/v1/auth/reset-password': 'Reset password with OTP',
        'POST /api/v1/auth/refresh-token': 'Refresh access token',
        'POST /api/v1/auth/resend-otp': 'Resend verification OTP',
        'GET /api/v1/auth/me': 'Get user profile (Bearer + API key)',
        'PUT /api/v1/auth/me': 'Update user profile',
      },
    },
  });
});

// ─── Static Files & SPA Fallback ───────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ─── API 404 Handler ────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
  });
});

// ─── SPA Fallback Handler ───────────────────────────────────────
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Error Handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// ─── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        🔐 AuthEasy API Server                ║');
  console.log('║    Developer Authentication Made Easy        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║   Server:    http://localhost:${PORT}           ║`);
  console.log(`║   Health:    http://localhost:${PORT}/api/health ║`);
  console.log(`║   API Docs:  http://localhost:${PORT}/api/docs   ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
