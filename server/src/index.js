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

// TEST ROUTE IMPORT
const developerAuthRoutes = require('./routes/developer.auth.routes');

const app = express();
const PORT = process.env.PORT || 4000;

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

app.get('/', (req, res) => {
  res.send('AuthEasy Server Running');
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AuthEasy API is running'
  });
});

// TEST ONLY THIS ROUTE
app.use('/api/dash', developerAuthRoutes);

console.log('About to start server...');

app.listen(PORT, () => {
  console.log(`Server successfully listening on port ${PORT}`);
});

module.exports = app;
const projectRoutes = require('./routes/project.routes');

app.use('/api/dash/projects', projectRoutes);