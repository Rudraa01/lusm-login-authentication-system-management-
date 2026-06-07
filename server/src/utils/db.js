const mysql = require('mysql2/promise');
const path = require('path');

// Ensure environment variables are loaded in case this file is required before index.js finishes setup
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in the environment variables!');
} else {
  // Force IPv4 loopback (127.0.0.1) instead of localhost. Node.js 18+ resolves
  // localhost to IPv6 ::1 by default, which causes "Access denied ... @ '::1'"
  // on Hostinger shared servers where MySQL only listens/authorizes on IPv4 loopback.
  connectionString = connectionString
    .replace('//localhost', '//127.0.0.1')
    .replace('@localhost', '@127.0.0.1');
}

const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  typeCast: function (field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      const value = field.string();
      return value === null ? null : value === '1';
    }
    return next();
  }
});

module.exports = pool;
