console.log('=== SERVER STARTING ===');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  console.warn('dotenv not loaded, relying on environment variables');
}

const express = require('express');
const requestLogger = require('./middleware/requestLogger');

const developerAuthRoutes = require('./routes/developer.auth.routes');
const projectRoutes = require('./routes/project.routes');
const userManagementRoutes = require('./routes/user.management.routes');
const adminRoutes = require('./routes/admin.routes');
const publicAuthRoutes = require('./routes/public.auth.routes');
const uiRoutes = require('./routes/ui.routes');

const app = express();
const PORT = process.env.PORT || 4000;

const publicPath = path.join(__dirname, '../public');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('Public Path:', publicPath);

app.use(express.json());

// ─── Setup DB Route (Temporary) ─────────────────────────────────
app.get('/api/setup-db', (req, res) => {
  try {
    const { execSync } = require('child_process');
    console.log('Running database migrations manually via route...');
    const output = execSync('node ./node_modules/prisma/build/index.js migrate deploy', { 
      cwd: path.join(__dirname, '../')
    });
    res.send(`<pre>Database migrated successfully!\n\n${output.toString()}</pre>`);
  } catch (err) {
    console.error('Manual DB Setup Error:', err);
    res.status(500).send(`<pre>Database migration failed:\n\n${err.message}\n\n${err.stdout ? err.stdout.toString() : ''}\n\n${err.stderr ? err.stderr.toString() : ''}</pre>`);
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AuthEasy API is running'
  });
});

// API Routes
app.use('/api/dash', developerAuthRoutes);
app.use('/api/dash/projects', projectRoutes);
app.use('/api/dash/projects', userManagementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/auth', requestLogger, publicAuthRoutes);
app.use('/api/v1/ui', requestLogger, uiRoutes);

// Static Frontend
app.use(express.static(publicPath));

// React SPA Fallback
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

console.log('About to start server...');

app.listen(PORT, () => {
  console.log(`Server successfully listening on port ${PORT}`);
});

module.exports = app;
