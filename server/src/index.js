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
    const nodePath = process.execPath;
    
    // Run diagnostics
    let log = '';
    const runCmd = (cmd) => {
      log += `\n$ ${cmd}\n`;
      try {
        log += execSync(cmd, { cwd: path.join(__dirname, '../'), env: { ...process.env, RUST_BACKTRACE: '1' } }).toString();
      } catch (e) {
        log += `ERROR: ${e.message}\nStdout: ${e.stdout ? e.stdout.toString() : ''}\nStderr: ${e.stderr ? e.stderr.toString() : ''}\n`;
      }
    };

    runCmd('uname -a');
    runCmd('openssl version');
    runCmd('ldd --version');
    runCmd('ls -la node_modules/@prisma/engines');
    
    // Find schema engine binary and try running it directly
    const fs = require('fs');
    const enginesDir = path.join(__dirname, '../node_modules/@prisma/engines');
    if (fs.existsSync(enginesDir)) {
      const files = fs.readdirSync(enginesDir);
      const schemaEngine = files.find(f => f.startsWith('schema-engine-') || f.startsWith('migration-engine-'));
      if (schemaEngine) {
        runCmd(`"${path.join(enginesDir, schemaEngine)}" --version`);
      } else {
        log += '\nNo schema-engine binary found in @prisma/engines\n';
      }
    } else {
      log += '\n@prisma/engines directory does not exist\n';
    }

    // Attempt migration with debug flags
    log += '\n--- Attempting migration with DEBUG=* and RUST_BACKTRACE=1 ---\n';
    try {
      const output = execSync(`"${nodePath}" ./node_modules/prisma/build/index.js migrate deploy`, {
        cwd: path.join(__dirname, '../'),
        env: { ...process.env, DEBUG: '*', RUST_BACKTRACE: '1' }
      });
      log += `SUCCESS:\n${output.toString()}\n`;
    } catch (e) {
      log += `FAILED:\n${e.message}\nStdout: ${e.stdout ? e.stdout.toString() : ''}\nStderr: ${e.stderr ? e.stderr.toString() : ''}\n`;
    }

    res.send(`<pre>${log}</pre>`);
  } catch (err) {
    res.status(500).send(`<pre>General error running setup-db:\n\n${err.message}\n${err.stack}</pre>`);
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
