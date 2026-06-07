const path = require('path');

// Safely load dotenv
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  console.warn('dotenv not loaded, relying on environment variables');
}

// Ensure no programmatic Prisma migrations run here. 
// Run them manually or via a secure API route later.

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

app.use(helmet());

const corsOptions = (req, callback) => {
  let options;
  const isPublicApi = req.path.startsWith('/api/v1/auth');
  
  if (isPublicApi) {
    options = { origin: true, credentials: true };
  } else {
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AuthEasy API is running 🚀' });
});

// API Routes
app.use('/api/dash', developerAuthRoutes);
app.use('/api/dash/projects', projectRoutes);
app.use('/api/dash/projects', userManagementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/auth', requestLogger, publicAuthRoutes);
app.use('/api/v1/ui', requestLogger, uiRoutes);

// Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// API 404 Handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// SPA Fallback Handler
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
    if (err) {
      console.error('Frontend index.html missing:', err.message);
      res.status(500).json({ success: false, message: 'Frontend not built.' });
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server successfully listening on port ${PORT}`);
});

module.exports = app;
