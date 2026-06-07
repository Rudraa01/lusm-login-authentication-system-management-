const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to asynchronously log all incoming public API requests.
 * Runs on response 'finish' to capture response status codes correctly.
 */
const requestLogger = (req, res, next) => {
  // Capture response finish event
  res.on('finish', async () => {
    // Only log if the request has a validated project attached (via validateApiKey)
    if (req.project && req.project.id) {
      try {
        // Log to database asynchronously without blocking client responses
        await db.query(
          `INSERT INTO ApiRequestLog (id, endpoint, method, statusCode, projectId, createdAt) 
           VALUES (?, ?, ?, ?, ?, NOW(3))`,
          [
            uuidv4(),
            req.baseUrl + req.path,
            req.method,
            res.statusCode,
            req.project.id,
          ]
        );
      } catch (err) {
        console.error('Request logger middleware error:', err);
      }
    }
  });

  next();
};

module.exports = requestLogger;
