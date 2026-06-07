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
const cors = require('cors');
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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const db = require('./utils/db');

// ─── Setup DB Route (Temporary) ─────────────────────────────────
app.get('/api/setup-db', async (req, res) => {
  let log = '=== DATABASE MIGRATION VIA RAW SQL ===\n';
  try {
    const queries = [
      // 1. Developer Table
      {
        name: 'Create Developer Table',
        sql: `CREATE TABLE IF NOT EXISTS \`Developer\` (
            \`id\` VARCHAR(191) NOT NULL,
            \`name\` VARCHAR(191) NOT NULL,
            \`email\` VARCHAR(191) NOT NULL,
            \`passwordHash\` VARCHAR(191) NOT NULL,
            \`isBlocked\` BOOLEAN NOT NULL DEFAULT false,
            \`isVerified\` BOOLEAN NOT NULL DEFAULT false,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            UNIQUE INDEX \`Developer_email_key\`(\`email\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      },
      // 2. Project Table
      {
        name: 'Create Project Table',
        sql: `CREATE TABLE IF NOT EXISTS \`Project\` (
            \`id\` VARCHAR(191) NOT NULL,
            \`name\` VARCHAR(191) NOT NULL,
            \`description\` VARCHAR(191) NOT NULL DEFAULT '',
            \`logoUrl\` VARCHAR(191) NOT NULL DEFAULT '',
            \`apiKey\` VARCHAR(191) NOT NULL,
            \`allowedOrigins\` VARCHAR(191) NOT NULL DEFAULT '',
            \`developerId\` VARCHAR(191) NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            UNIQUE INDEX \`Project_apiKey_key\`(\`apiKey\`),
            INDEX \`Project_developerId_idx\`(\`developerId\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      },
      // 3. EndUser Table
      {
        name: 'Create EndUser Table',
        sql: `CREATE TABLE IF NOT EXISTS \`EndUser\` (
            \`id\` VARCHAR(191) NOT NULL,
            \`email\` VARCHAR(191) NOT NULL,
            \`phone\` VARCHAR(191) NULL,
            \`passwordHash\` VARCHAR(191) NOT NULL,
            \`name\` VARCHAR(191) NOT NULL DEFAULT '',
            \`avatarUrl\` VARCHAR(191) NOT NULL DEFAULT '',
            \`isVerified\` BOOLEAN NOT NULL DEFAULT false,
            \`isBlocked\` BOOLEAN NOT NULL DEFAULT false,
            \`projectId\` VARCHAR(191) NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            INDEX \`EndUser_projectId_idx\`(\`projectId\`),
            UNIQUE INDEX \`EndUser_email_projectId_key\`(\`email\`, \`projectId\`),
            UNIQUE INDEX \`EndUser_phone_projectId_key\`(\`phone\`, \`projectId\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      },
      // 4. Otp Table
      {
        name: 'Create Otp Table',
        sql: `CREATE TABLE IF NOT EXISTS \`Otp\` (
            \`id\` VARCHAR(191) NOT NULL,
            \`code\` VARCHAR(191) NOT NULL,
            \`type\` VARCHAR(191) NOT NULL,
            \`expiresAt\` DATETIME(3) NOT NULL,
            \`usedAt\` DATETIME(3) NULL,
            \`endUserId\` VARCHAR(191) NULL,
            \`developerId\` VARCHAR(191) NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            INDEX \`Otp_endUserId_idx\`(\`endUserId\`),
            INDEX \`Otp_developerId_idx\`(\`developerId\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      },
      // 5. RefreshToken Table
      {
        name: 'Create RefreshToken Table',
        sql: `CREATE TABLE IF NOT EXISTS \`RefreshToken\` (
            \`id\` VARCHAR(191) NOT NULL,
            \`token\` VARCHAR(191) NOT NULL,
            \`expiresAt\` DATETIME(3) NOT NULL,
            \`endUserId\` VARCHAR(191) NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            UNIQUE INDEX \`RefreshToken_token_key\`(\`token\`),
            INDEX \`RefreshToken_endUserId_idx\`(\`endUserId\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      },
      // 6. ApiRequestLog Table
      {
        name: 'Create ApiRequestLog Table',
        sql: `CREATE TABLE IF NOT EXISTS \`ApiRequestLog\` (
            \`id\` VARCHAR(191) NOT NULL,
            \`endpoint\` VARCHAR(191) NOT NULL,
            \`method\` VARCHAR(191) NOT NULL,
            \`statusCode\` INTEGER NOT NULL,
            \`projectId\` VARCHAR(191) NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            INDEX \`ApiRequestLog_projectId_idx\`(\`projectId\`),
            INDEX \`ApiRequestLog_createdAt_idx\`(\`createdAt\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      },
      // 7. PrebuiltUi Table
      {
        name: 'Create PrebuiltUi Table',
        sql: `CREATE TABLE IF NOT EXISTS \`PrebuiltUi\` (
            \`id\` VARCHAR(191) NOT NULL,
            \`title\` VARCHAR(191) NOT NULL,
            \`description\` VARCHAR(191) NOT NULL DEFAULT '',
            \`type\` VARCHAR(191) NOT NULL,
            \`htmlCode\` LONGTEXT NOT NULL,
            \`cssCode\` LONGTEXT NOT NULL,
            \`jsCode\` LONGTEXT NOT NULL,
            \`reactCode\` LONGTEXT NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      },
      // Foreign Keys
      {
        name: 'Add Project -> Developer FK',
        sql: `ALTER TABLE \`Project\` ADD CONSTRAINT \`Project_developerId_fkey\` FOREIGN KEY (\`developerId\`) REFERENCES \`Developer\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'Add EndUser -> Project FK',
        sql: `ALTER TABLE \`EndUser\` ADD CONSTRAINT \`EndUser_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'Add Otp -> EndUser FK',
        sql: `ALTER TABLE \`Otp\` ADD CONSTRAINT \`Otp_endUserId_fkey\` FOREIGN KEY (\`endUserId\`) REFERENCES \`EndUser\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'Add Otp -> Developer FK',
        sql: `ALTER TABLE \`Otp\` ADD CONSTRAINT \`Otp_developerId_fkey\` FOREIGN KEY (\`developerId\`) REFERENCES \`Developer\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'Add RefreshToken -> EndUser FK',
        sql: `ALTER TABLE \`RefreshToken\` ADD CONSTRAINT \`RefreshToken_endUserId_fkey\` FOREIGN KEY (\`endUserId\`) REFERENCES \`EndUser\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'Add ApiRequestLog -> Project FK',
        sql: `ALTER TABLE \`ApiRequestLog\` ADD CONSTRAINT \`ApiRequestLog_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;`
      }
    ];

    for (const q of queries) {
      log += `\nRunning: ${q.name}...\n`;
      try {
        await db.query(q.sql);
        log += `SUCCESS\n`;
      } catch (err) {
        log += `WARNING/FAILED: ${err.message}\n`;
      }
    }

    log += '\n=== MIGRATION COMPLETE ===\n';
    res.send(`<pre>${log}</pre>`);
  } catch (err) {
    res.status(500).send(`<pre>General error running setup-db:\n\n${err.message}\n${err.stack}</pre>`);
  }
});

// ─── Test Prisma Route (Now test-db using mysql2) ────────────────
app.get('/api/test-prisma', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM Developer');
    res.json({ success: true, message: 'Database connection via mysql2 is working perfectly!', developerCount: rows[0].count });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Database query failed.', 
      error: err.message, 
      stack: err.stack 
    });
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
