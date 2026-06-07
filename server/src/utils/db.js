const mysql = require('mysql2/promise');
const path = require('path');

// Ensure environment variables are loaded in case this file is required before index.js finishes setup
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let connectionString = process.env.DATABASE_URL;
let poolConfig = {};

if (!connectionString) {
  console.error('DATABASE_URL is not defined in the environment variables!');
} else {
  try {
    // Clean any accidental environment variable prefixing or quotes
    connectionString = connectionString.replace(/^DATABASE_URL=/i, '').trim();
    connectionString = connectionString.replace(/^['"]|['"]$/g, '');

    // Remove protocol prefix mysql://
    const withoutProtocol = connectionString.replace(/^mysql:\/\//i, '');
    
    // Find the last '@' separating user/pass from host/database
    const lastAtIndex = withoutProtocol.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const credentialsPart = withoutProtocol.substring(0, lastAtIndex);
      const hostDbPart = withoutProtocol.substring(lastAtIndex + 1);
      
      // Extract user and password
      const colonIndex = credentialsPart.indexOf(':');
      let user = credentialsPart;
      let password = '';
      if (colonIndex !== -1) {
        user = credentialsPart.substring(0, colonIndex);
        password = credentialsPart.substring(colonIndex + 1);
      }
      
      // Extract host/port and database
      const slashIndex = hostDbPart.indexOf('/');
      let hostPort = hostDbPart;
      let database = '';
      if (slashIndex !== -1) {
        hostPort = hostDbPart.substring(0, slashIndex);
        database = hostDbPart.substring(slashIndex + 1);
      }
      
      // Extract host and port
      const hostColonIndex = hostPort.indexOf(':');
      let host = hostPort;
      let port = 3306;
      if (hostColonIndex !== -1) {
        host = hostPort.substring(0, hostColonIndex);
        port = parseInt(hostPort.substring(hostColonIndex + 1)) || 3306;
      }
      
      // Bypass Node's default loopback resolution to IPv6 ::1
      if (host === 'localhost') {
        host = '127.0.0.1';
      }
      
      poolConfig = {
        host: decodeURIComponent(host),
        port: port,
        user: decodeURIComponent(user),
        password: decodeURIComponent(password),
        database: decodeURIComponent(database.split('?')[0])
      };
    } else {
      poolConfig = { uri: connectionString };
    }
  } catch (err) {
    console.error('Failed to parse DATABASE_URL, falling back to direct URI:', err);
    poolConfig = { uri: connectionString };
  }
}

const pool = mysql.createPool({
  ...poolConfig,
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
