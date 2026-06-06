const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        await prisma.apiRequestLog.create({
          data: {
            endpoint: req.baseUrl + req.path,
            method: req.method,
            statusCode: res.statusCode,
            projectId: req.project.id,
          },
        });
      } catch (err) {
        console.error('Request logger middleware error:', err);
      }
    }
  });

  next();
};

module.exports = requestLogger;
